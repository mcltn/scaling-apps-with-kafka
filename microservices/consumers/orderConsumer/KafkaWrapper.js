const Kafka = require('node-rdkafka');

class KafkaWrapper {
    constructor(brokers, protocol, mechanism, username, password) {
        // ibm cloud service credentials
        // let jsonCredentials = JSON.parse(ibmcloud_credentials)
        // let brokers = jsonCredentials.kafka_brokers_sasl
        // let apiKey = jsonCredentials.api_key
        // producer
        // let driver_options = {
        //     //'debug': 'all',
        //     'metadata.broker.list': brokers,
        //     'security.protocol': 'SASL_SSL',
        //     'sasl.mechanisms': 'PLAIN',
        //     'sasl.username': 'token',
        //     'sasl.password': apiKey,
        //     'log.connection.close' : false,
        //     'enable.auto.commit': false
        // };
        let driver_options = {
            //'debug': 'all',
            'metadata.broker.list': brokers,
            //'security.protocol': protocol,
            //'sasl.mechanisms': mechanism,
            //'sasl.username': username,
            //'sasl.password': password,
            'log.connection.close' : false,
            'enable.auto.commit': false
        };
        let consumerConfig = {
            'client.id': 'orders-consumer',
            'group.id': 'orders-consumer-group',
        }

        for (var key in driver_options) {
            consumerConfig[key] = driver_options[key]
        }

        // create kafka consumer
        let topicConfig = {
            'auto.offset.reset': 'earliest'
        }
        let consumer = new Kafka.KafkaConsumer(consumerConfig, topicConfig)

        // Register error listener
        consumer.on('event.error', function(err) {
            console.error('Error from consumer:' + JSON.stringify(err));
        });

        this.consumer = consumer

        // producer
        let producerConfig = {
            'client.id': 'example-orders-producer',
            'dr_msg_cb': true  // Enable delivery reports with message payload
        }

        for (var key in driver_options) {
            producerConfig[key] = driver_options[key]
        }

        // create kafka producer
        let producerTopicConfig = {
            'request.required.acks': -1
            // 'produce.offset.report': true
        }
        let producer = new Kafka.Producer(producerConfig, producerTopicConfig)
        producer.setPollInterval(100)

        // debug
        // producer.on('event.log', function(log) {
        //     console.log(log);
        // });

        // Register error listener
        producer.on('event.error', function(err) {
            console.error('Error from producer:' + JSON.stringify(err));
        });

        // Register delivery report listener
        producer.on('delivery-report', function(err, dr) {
            if (err) {
                console.error('Delivery report: Failed sending message ' + dr.value);
                console.error(err);
                // We could retry sending the message
            } else {
                console.log('Message produced, partition: ' + dr.partition + ' offset: ' + dr.offset);
            }
        });
        producer.connect()

        this.producer = producer
    }
  
    on(event, callback) {
      this.consumer.on(event, callback)
    }

    createEvent(order, event, simulatorConfig, callback) {
        let topicName = 'orders'
        let eventType = event
        let message = Buffer.from(JSON.stringify({eventType, payload: order, simulatorConfig}))
        try {
            this.producer.produce(
                topicName,
                null,
                message,
                order.orderId
            )
            callback(null)
        } catch (err) {
            console.log('caught')
            callback(err)
        }
    }

    createdOrderEvent(order, simulatorConfig, callback) {
        this.createEvent(order, 'orderCreated', simulatorConfig, callback)
    }

    validatedEvent(order, simulatorConfig, callback) {
        this.createEvent(order, 'orderValidated', simulatorConfig, callback)
    }

    updateHttpResponse(payload, simulatorConfig, callback) {
        this.createEvent(payload, 'updateHttpResponse', simulatorConfig, callback)
    }
}

// const kafkaWrapper = new KafkaWrapper(process.env.KAFKA_CREDENTIALS)
const kafkaWrapper = new KafkaWrapper(process.env.BOOTSTRAP_SERVERS,
                                      process.env.SECURITY_PROTOCOL,
                                      process.env.SASL_MECHANISMS,
                                      process.env.SASL_USERNAME,
                                      process.env.SASL_PASSWORD)
Object.freeze(kafkaWrapper)

module.exports = kafkaWrapper