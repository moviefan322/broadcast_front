import type { Socket } from 'socket.io-client';
import type { Device, Transport } from 'mediasoup-client/types';

export const createProducerTransport = async (
	socket: Socket,
	device: Device
): Promise<Transport> => {
	const { paramsFromServer } = await socket.emitWithAck('requestTransport', {
		type: 'producer'
	});

	const producerTransport = device.createSendTransport(paramsFromServer);

	console.log('producer transport created with params:', paramsFromServer);

	producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
		// transport connect will not fire until transport.produce()
		// dtls params are created by the browser in order
		// to finish the other half of the connection
		// emit connectTransport
		console.log('connect running on produce');
		const connectResp = await socket.emitWithAck('connectTransport', {
			dtlsParameters,
			type: 'producer'
		});
		console.log('connect response from server:', connectResp);
		if (connectResp.ok) {
			callback();
		} else {
			errback(new Error('Failed to connect transport'));
		}
	});
	producerTransport.on('produce', async (parameters, callback, errback) => {
		// emit startProducing
		console.log('Produce event is now running');
		const { kind, rtpParameters } = parameters;
		const produceResp = await socket.emitWithAck('startProducing', {
			kind,
			rtpParameters
		});
		console.log('produce response from server:', produceResp);
		if (produceResp.ok) {
			callback({ id: produceResp.producerId });
		} else {
			errback(new Error('Failed to produce'));
		}
	});
    producerTransport.on('connectionstatechange', (state) => {
	console.log('==producer connectionstatechange==');
	console.log(state);
});

producerTransport.on('icegatheringstatechange', (state) => {
	console.log('==producer icegatheringstatechange==');
	console.log(state);
});

	return producerTransport;
};
