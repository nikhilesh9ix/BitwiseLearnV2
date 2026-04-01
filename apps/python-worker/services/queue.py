import json
import aio_pika
from config import get_settings

settings = get_settings()

_connection = None
_channel = None


async def get_channel():
    global _connection, _channel
    if _connection is None or _connection.is_closed:
        _connection = await aio_pika.connect_robust(settings.MQ_CLIENT)
        _channel = await _connection.channel()
    return _channel


async def start_consumer(queue_name: str, callback):
    """Start consuming messages from a RabbitMQ queue."""
    connection = await aio_pika.connect_robust(settings.MQ_CLIENT)
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=1)

    queue = await channel.declare_queue(queue_name, durable=True)

    async def on_message(message: aio_pika.abc.AbstractIncomingMessage):
        async with message.process():
            body = json.loads(message.body.decode())
            await callback(body)

    await queue.consume(on_message)
    return connection


async def publish_message(queue_name: str, message: dict):
    channel = await get_channel()
    await channel.declare_queue(queue_name, durable=True)
    await channel.default_exchange.publish(
        aio_pika.Message(
            body=json.dumps(message).encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        ),
        routing_key=queue_name,
    )
