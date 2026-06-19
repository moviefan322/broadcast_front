import type { Socket } from 'socket.io-client';
import type { Device, Transport, Consumer } from 'mediasoup-client/types';

export const createConsumer = async (
	consumerTransport: Transport,
	device: Device,
	socket: Socket
): Promise<Consumer | null> => {
	const consumeResp = await socket.emitWithAck('consumeMedia', {
		rtpCapabilities: device.recvRtpCapabilities
	});

	console.log('consume response:', consumeResp);

	if (!consumeResp.ok) {
		console.error('Consume failed:', consumeResp.error);
		return null;
	}

	const consumer = await consumerTransport.consume(consumeResp.consumerParams);

	consumer.track.onunmute = () => {
		console.log('consumer track unmuted — RTP is flowing');
	};

	consumer.track.onmute = () => {
		console.log('consumer track muted');
	};

	console.log('consumer track:', {
		id: consumer.track.id,
		kind: consumer.track.kind,
		enabled: consumer.track.enabled,
		muted: consumer.track.muted,
		readyState: consumer.track.readyState
	});

	console.log('consumer track:', {
		id: consumer.track.id,
		kind: consumer.track.kind,
		enabled: consumer.track.enabled,
		muted: consumer.track.muted,
		readyState: consumer.track.readyState
	});

	console.log('consume() has finished:', consumer);

	const unpause = await socket.emitWithAck('unpauseConsumer');

	console.log('unpause consumer response:', unpause);

	return consumer;
};
