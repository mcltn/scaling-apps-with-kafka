const KafkaWrapper = require('./KafkaWrapper.js')
const Redis = require('ioredis');

// connect to redis localhost
const redis = new Redis()

KafkaWrapper.consumer.on('ready', function() {
    console.log('The consumer has connected.');
    KafkaWrapper.consumer.subscribe(['orders']);
    KafkaWrapper.consumer.consume()
}).on('data', function(data) {
    try {
        let dataObject = JSON.parse(data.value.toString())
        // dataObject
        // {eventType, payload: {requestId, message}}
        let eventType = dataObject.eventType
        let payload = dataObject.payload
        switch (eventType) {
            case "updateHttpResponse":
                redis.set(payload.requestId, payload.message, 'EX', 3600)
                KafkaWrapper.consumer.commitMessage(data)
                break;
            default:
                // console.log(`${dataObject.eventType} is not handled in this service`)
                KafkaWrapper.consumer.commitMessage(data)
        }
    } catch (err) {
        console.error(err)
        // add error response to redis
        KafkaWrapper.consumer.commitMessage(data)
    }
});

KafkaWrapper.producer.on('ready', () => {
    console.log('The producer has connected.')
    KafkaWrapper.consumer.connect()
})