import { Socket } from 'socket.io-client';
import type { Device } from 'mediasoup-client/types';
import { createConsumerTransport } from './createConsumerTransport.js';
import { createConsumer } from './createConsumer.js';

export const requestTransportToConsume = async (socket: Socket, device: Device) => {
	const consumerTransportParams = await socket.emitWithAck('requestTransport', {
		type: 'consumer'
	});
	const { paramsFromServer } = consumerTransportParams;
	console.log('consumer transport params from server:', paramsFromServer);
	// console.log(
	// 	'consumer ice candidates:',
	// 	paramsFromServer.iceCandidates.map((c: any) => ({
	// 		ip: c.ip,
	// 		port: c.port,
	// 		protocol: c.protocol
	// 	}))
	// );
	const consumerTransport = createConsumerTransport(paramsFromServer, device, socket);
	console.log('consumer transport created:', consumerTransport);
	const consumer = await createConsumer(consumerTransport, device, socket);
	console.log('consumer created:', consumer);

	if (!consumer) {
		console.error('Failed to create consumer');
		return null;
	}

	const stream = new MediaStream([consumer.track]);
	console.log('Created MediaStream from consumer track:', stream);
	return stream;
};
