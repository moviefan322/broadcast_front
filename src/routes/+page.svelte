<script lang="ts">
	import { onMount } from 'svelte';
	import { io, type Socket } from 'socket.io-client';
	import * as mediasoupClient from 'mediasoup-client';

	let socket: Socket | null = null;
	let device: mediasoupClient.Device | null = null;
	let connected = $state(false);

	let userName = $state('philip');
	let roomName = $state('demo-room');
	let roomStatus = $state('Not joined');

	let broadcastStatus = $state('Not Broadcasting');
	let isBroadcasting = $state(false);
	let isConsuming = $state(false);

	const connectSocket = async () => {
		if (socket) {
			console.log('socket already exists:', socket.id);
			return;
		}

		socket = io('http://localhost:3000');

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
		// device = new mediasoupClient.Device();
		// const routerRtpCapabilities = await socket?.emitWithAck('getRtpCap');
		// console.log('routerRtpCapabilities', routerRtpCapabilities);
	};

	const startBroadcasting = async () => {
		isBroadcasting = true;
		broadcastStatus = 'Broadcasting...';
	};

	// const startConsuming = async () => {
	// 	isConsuming = true;
	// 	status = 'Consuming broadcast...';
	// };

	const stopBroadcasting = async () => {
		isBroadcasting = false;
		broadcastStatus = 'Broadcast stopped';
	};

	let remoteAudioEl: HTMLAudioElement;

	// const attachRemoteTrack = async (track: MediaStreamTrack) => {
	// 	const stream = new MediaStream([track]);

	// 	remoteAudioEl.srcObject = stream;

	// 	try {
	// 		await remoteAudioEl.play();
	// 		status = 'Playing remote audio';
	// 	} catch (err) {
	// 		console.log('audio play blocked:', err);
	// 		status = 'Audio received — click play if browser blocked autoplay';
	// 	}
	// };

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
		background: #100d10;
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
