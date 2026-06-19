import type { Device, TransportOptions } from 'mediasoup-client/types';
import type { Socket } from 'socket.io-client';

export const createConsumerTransport = (
	transportParams: TransportOptions,
	device: Device,
	socket: Socket
) => {
	const consumerTransport = device.createRecvTransport(transportParams);
	consumerTransport.on('connectionstatechange', (state) => {
		console.log('==connectionstatechange==');
		console.log(state);
	});
	consumerTransport.on('icegatheringstatechange', (state) => {
		console.log('==icegatheringstatechange==');
		console.log(state);
	});
	// transport connect listener, fires on .consume()
	consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
		console.log('==consumer transport connect event fired==');
		// connect comes with local dtlsParameters, we
		// need to send these to the server to finish xtion
		const connectResp = await socket.emitWithAck('connectTransport', {
			dtlsParameters,
			type: 'consumer'
		});
		console.log('connect response from server:', connectResp);
		if (connectResp.ok) {
			callback();
		} else {
			errback(new Error('Failed to connect transport'));
		}
	});
	return consumerTransport;
};
