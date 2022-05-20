import * as client from 'amqplib';
import type { Channel, Connection, Message as _Message } from 'amqplib';

import logger from "@shared-kernel/logger";
import { Queues } from "@shared-kernel/queue";


export type Message = _Message;

// TODO: Add docs
export default class QueueClient {
  private readonly connectionUrl: string;
  
  private connection: Connection;
  private channel: Channel;
  private readonly queueName: Queues;

  private isConnected: boolean = false;
  public get IsConnected(): boolean {
    return this.isConnected;
  }

  constructor(queueName: Queues) {
    if (!process.env.MQ_HOST) throw new TypeError('MQ_HOST env var is not defined');
    if (!queueName) throw new TypeError("Queue name is required");

    this.connectionUrl = process.env.MQ_HOST;
    this.queueName = queueName;
  }

  public async connect() {
    try {
      logger.info(`Connecting to queue ${this.queueName}`);
      
      this.connection = await client.connect(this.connectionUrl);
      this.channel = await this.connection.createChannel();
      this.channel.assertQueue(this.queueName.toString(), { durable: true });
      this.isConnected = true;
      logger.info(`Connected to queue ${this.queueName} successfully`);
    } catch (e) {
      logger.error('Failed creating connection to MQ', e);
      throw e;
    }
  }

  public async subscribe(callback: (msg: Message) => Promise<void> | void) {
    try {
      if (!this.isConnected) {
        throw new Error("You should connect to queue first! Call connect() method");
      }
      await this.channel.consume(this.queueName.toString(), callback);
    } catch (e) {
      logger.error('Failed subscribing to MQ', e);
      throw e;
    }
  }
}