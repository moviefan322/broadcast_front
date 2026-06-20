<script lang="ts">
	import type { Transport, Producer } from 'mediasoup-client/types';
	import { onMount } from 'svelte';
	import { io, type Socket } from 'socket.io-client';
	import { Device } from 'mediasoup-client';

	import { requestTransportToConsume } from '$lib/mediaSoupUtils/requestTransportToConsume.js';
	import { createProducerTransport } from '$lib/mediaSoupUtils/createProducerTransport.js';
	import { createProducer } from '$lib/mediaSoupUtils/createProducer.js';

	import { PUBLIC_SOCKET_URL } from '$env/static/public';

	let socket: Socket | null = null;
	let device: Device | null = null;
	let localStream: MediaStream | null = null;
	let producerTransport: Transport | null = null;
	let audioProducer: Producer | null = null;
	let remoteAudioEl: HTMLAudioElement;

	let connected = $state(false);

	let userName = $state('philip');
	let roomName = $state('demo-room');
	let roomStatus = $state('Not joined');

	let broadcastStatus = $state('Not Broadcasting');
	let isBroadcasting = $state(false);
	let isConsuming = $state(false);
	let isBroadcasterMuted = $state(false);

	const connectSocket = async () => {
		if (socket) {
			console.log('socket already exists:', socket.id);
			return;
		}

		socket = io(PUBLIC_SOCKET_URL);

		socket.on('connect', () => {
			connected = true;
			console.log('connected:', socket?.id);
		});

		socket.on('disconnect', () => {
			connected = false;
			console.log('disconnected');
		});
	};

	// const setupDevice = async () => {
	// 	status = 'Setting up device...';
	// };

	const joinRoom = async () => {
		if (!socket) {
			console.error('Socket not initialized');
			return;
		}
		const joinRoomResp = await socket.emitWithAck('joinRoom', {
			userName,
			roomName
		});
		console.log('joinRoomResp', joinRoomResp);
		device = new Device();
		await device.load({
			routerRtpCapabilities: joinRoomResp.routerRtpCapabilities
		});
		console.log('device loaded with capabilities:', device);

		if (joinRoomResp.producerAvailable && !isBroadcasting) {
			console.log('producer is available, setting up consumer transport');
			const remoteStream = await requestTransportToConsume(socket, device);

			if (!remoteStream) {
				console.error('Failed to get remote stream');
				return;
			}
			remoteAudioEl.srcObject = remoteStream;
			console.log(
				'remote stream tracks:',
				remoteStream.getTracks().map((track) => ({
					id: track.id,
					kind: track.kind,
					enabled: track.enabled,
					muted: track.muted,
					readyState: track.readyState
				}))
			);

			console.log('remoteAudioEl after srcObject:', {
				srcObject: remoteAudioEl.srcObject,
				paused: remoteAudioEl.paused,
				muted: remoteAudioEl.muted,
				volume: remoteAudioEl.volume,
				autoplay: remoteAudioEl.autoplay
			});

			try {
				await remoteAudioEl.play();

				console.log('remoteAudioEl.play() succeeded');

				roomStatus = 'Playing remote audio';
			} catch (err) {
				console.log('remoteAudioEl.play() failed:', err);

				roomStatus = 'Audio received — click play if browser blocked autoplay';
			}
			isConsuming = true;
		}

		// TODO: GET CONSUMERS LINKED UP
	};

	const enableFeed = async () => {
		localStream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: false
		});

		console.log('audio track:', localStream.getAudioTracks()[0]);
	};

	const sendFeed = async () => {
		// create transport for THIS client's upstream
		if (!socket || !device) {
			console.error('Socket or device not initialized');
			return;
		}
		if (!localStream) {
			console.error('Local stream not initialized');
			return;
		}
		producerTransport = await createProducerTransport(socket, device);
		console.log('producer transport created:', producerTransport);
		const producer = await createProducer(localStream, producerTransport);
		if (!producer) {
			console.error('Producer not created');
			return;
		}
		audioProducer = producer;
		console.log('audio producer created:', audioProducer);
	};

	const startBroadcasting = async () => {
		isBroadcasting = true;
		broadcastStatus = 'Broadcasting...';
		await enableFeed();
		console.log('starting broadcast with stream:', localStream);
		await sendFeed();
	};

	const stopBroadcasting = async () => {
		isBroadcasting = false;
		broadcastStatus = 'Broadcast stopped';
	};

	const toggleBroadcastMute = () => {
		if (!audioProducer) {
			console.error('No audio producer to mute/unmute');
			return;
		}

		if (isBroadcasterMuted) {
			audioProducer.resume();
			isBroadcasterMuted = false;
			broadcastStatus = 'Broadcasting...';

			console.log('producer resumed:', {
				paused: audioProducer.paused,
				trackEnabled: audioProducer.track?.enabled
			});
		} else {
			audioProducer.pause();
			isBroadcasterMuted = true;
			broadcastStatus = 'Broadcasting muted';

			console.log('producer paused:', {
				paused: audioProducer.paused,
				trackEnabled: audioProducer.track?.enabled
			});
		}
	};

	onMount(() => {
		connectSocket();

		return () => {
			console.log('disconnecting socket:', socket?.id);
			socket?.disconnect();
			socket = null;
		};
	});
</script>

<main class="page">
	<div class="form-grid">
		<label>
			<span>User name</span>
			<input bind:value={userName} placeholder="philip" />
		</label>

		<label>
			<span>Room name</span>
			<input bind:value={roomName} placeholder="demo-room" />
		</label>

		<button class="secondary-button" onclick={joinRoom} disabled={!connected}> Join Room </button>
	</div>

	<p class="status">{roomStatus}</p>
	<section class="card">
		<h1>Audio Broadcast Demo</h1>

		<p class="status">{connected}</p>
		<p class="status">{broadcastStatus}</p>

		<div class="controls">
			<button class="broadcast-button" onclick={startBroadcasting} disabled={isBroadcasting}>
				{isBroadcasting ? 'Broadcasting' : 'Start Broadcast'}
			</button>

			<button
				class="secondary-button"
				onclick={toggleBroadcastMute}
				// disabled={!isBroadcasting || !audioProducer}
			>
				{isBroadcasterMuted ? 'Unmute' : 'Mute'}
			</button>

			<button class="secondary-button" onclick={stopBroadcasting} disabled={!isBroadcasting}>
				Stop
			</button>
		</div>

		<div class="state-grid">
			<div>
				<span class="label">Broadcaster</span>
				<span class:active={isBroadcasting}>
					{isBroadcasting ? 'Active' : 'Inactive'}
				</span>
			</div>

			<div>
				<span class="label">Consumer</span>
				<span class:active={isConsuming}>
					{isConsuming ? 'Listening' : 'Waiting'}
				</span>
			</div>
		</div>

		<audio bind:this={remoteAudioEl} controls autoplay></audio>
	</section>
</main>

<style>
	.page {
		min-height: 100vh;
		display: grid;
		place-items: center;
		background: #725380;
		color: #f3eaf1;
		font-family:
			Inter,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
	}

	.card {
		width: min(420px, calc(100vw - 32px));
		padding: 32px;
		border: 1px solid #5e4057;
		border-radius: 24px;
		background: linear-gradient(145deg, #171117, #241722);
		box-shadow: 0 24px 80px rgba(255, 79, 219, 0.12);
	}

	h1 {
		margin: 0 0 12px;
		font-size: 28px;
	}

	.status {
		margin-bottom: 24px;
		color: #c8bac5;
	}

	.controls {
		display: flex;
		gap: 12px;
		margin-bottom: 24px;
	}

	button {
		border: 0;
		border-radius: 999px;
		padding: 12px 18px;
		font-weight: 700;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.broadcast-button {
		background: #d71920;
		color: white;
	}

	.secondary-button {
		background: #33202f;
		color: #f3eaf1;
		border: 1px solid #6f5b69;
	}

	.state-grid {
		display: grid;
		gap: 12px;
		margin-bottom: 24px;
	}

	.state-grid > div {
		display: flex;
		justify-content: space-between;
		border-bottom: 1px solid #33202f;
		padding-bottom: 8px;
	}

	.label {
		color: #8a7a86;
	}

	.active {
		color: #ff4fdb;
		font-weight: 700;
	}

	audio {
		width: 100%;
	}

	.form-grid {
		display: grid;
		gap: 14px;
		margin-bottom: 20px;
	}

	label {
		display: grid;
		gap: 6px;
		color: #c8bac5;
		font-size: 14px;
	}

	input {
		width: 100%;
		border: 1px solid #6f5b69;
		border-radius: 12px;
		background: #191219;
		color: #f3eaf1;
		padding: 12px 14px;
		font: inherit;
		box-sizing: border-box;
	}

	input:focus {
		outline: 2px solid #ff4fdb;
		border-color: #ff4fdb;
	}
</style>
