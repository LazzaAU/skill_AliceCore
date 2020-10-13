/**
 * This is almost a copy of the official Nore-red MQTT in node found on node-red repository.
 * It's been fitted to our needs of simplicity for everyday use and repackaged
 */

module.exports = function(RED) {
	let isUtf8 = require('is-utf8');

	function onAliceEvent(config) {
		RED.nodes.createNode(this, config);

		this.topic = `projectalice/events/${config.event}`;
		this.broker = config.broker;
		this.brokerInstance = RED.nodes.getNode(this.broker);
		this.datatype = config.datatype || 'utf8';

		let node = this;

		if (this.brokerInstance) {
			this.status({
				fill: 'red',
				shape: 'ring',
				text: 'node-red:common.status.disconnected'
			});

			this.brokerInstance.register(this);
			this.brokerInstance.subscribe(this.topic, 2, function(topic, payload, packet){
				if (node.datatype === 'buffer') {
					// payload = payload;
				} else if (node.datatype === 'base64') {
					payload = payload.toString('base64');
				} else if (node.datatype === 'utf8') {
					payload = payload.toString('utf8');
				} else if (node.datatype === 'json') {
					if (isUtf8(payload)) {
						payload = payload.toString();
						try {
							payload = JSON.parse(payload);
						}
						catch(e) {
							node.error(RED._('mqtt.errors.invalid-json-parse'), {
								payload: payload,
								topic: topic,
								qos: packet.qos,
								retain: packet.retain
							});
							return;
						}
					} else {
						node.error(RED._('mqtt.errors.invalid-json-string'), {
								payload: payload,
								topic: topic,
								qos: packet.qos,
								retain: packet.retain
							});
						return;
					}
				} else {
					if (isUtf8(payload)) {
						payload = payload.toString();
					}
				}

				node.send({
					topic: topic,
					payload: payload,
					qos:packet.qos,
					retain:packet.retain
				});
			}, this.id);
			if (this.brokerInstance.connected) {
				node.status({
					fill: 'green',
					shape: 'dot',
					text: 'node-red:common.status.connected'
				})
			}
		}

		this.on('close', function(removed, done) {
			if (node.brokerInstance) {
				node.brokerInstance.unsubscribe(node.topic, node.id, removed);
				node.brokerInstance.deregister(node, done);
			}
		})
	}

	RED.nodes.registerType('onAliceEvent', onAliceEvent);
}
