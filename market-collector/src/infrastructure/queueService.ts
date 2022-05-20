import { Connection, Channel } from "amqplib";
import * as client from "amqplib";
import { Candle } from "@shared-kernel/candle";
import { Queues } from "@shared-kernel/queue";
import logger from "@shared-kernel/logger";

export default class QueueService {
  connection: Connection = null;
  channel: Channel = null;
  queueName: Queues;

  constructor(queueName: Queues) {
    this.queueName = queueName;
  }
  async init() {
    await this.connect();
    await this.createChannel();
    await this.assertQueue(this.queueName);
  }

  async connect() {
    if (!process.env.MQ_HOST)
      throw new TypeError("MQ_HOST env var is not defined");
    try {
      logger.info("Trying to connect to RabbitMq");
      this.connection = await client.connect(process.env.MQ_HOST);
      logger.info("Succesfully connected to RabbitMq");
    } catch (e) {
      logger.error(
        "An error has occurred while connecting to RabbitMq server",
        e
      );
    }
  }

  async createChannel() {
    try {
      logger.info("Trying to create a channel");
      this.channel = await this.connection.createChannel();
      logger.info("Channel succesfully created");
    } catch (e) {
      logger.error("An error has occurred while creating channel", e);
    }
  }

  async assertQueue(queueName) {
    if (!queueName) throw new Error("queueName is required");
    try {
      logger.info("Trying to assert queue");
      await this.channel.assertQueue(queueName.toString());
      logger.info(`Queue ${queueName.toString()} succesfully asserted`);
    } catch (e) {
      logger.error("An error has occurred while asserting queue", e);
    }
  }

  async send(message: Candle) {
    try {
      await this.channel.sendToQueue(
        this.queueName.toString(),
        Buffer.from(JSON.stringify(message))
      );
      logger.info(
        `Sended message to queue: ${this.queueName.toString()}`,
        JSON.stringify(message, null, 2)
      );
    } catch (e) {
      logger.error("An error has occurred while sending message", e);
    }
  }
}
