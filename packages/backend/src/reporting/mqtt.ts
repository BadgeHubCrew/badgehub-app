import { BadgeHubData } from "#domain/BadgeHubData";
import { IS_DEV_ENVIRONMENT, MQTT_CONFIG } from "#config";
import mqtt from "mqtt";
import { PostgreSQLBadgeHubMetadata } from "#db/PostgreSQLBadgeHubMetadata";
import { PostgreSQLBadgeHubFiles } from "#db/PostgreSQLBadgeHubFiles";

export async function startMqtt(
  badgeHubData: BadgeHubData = new BadgeHubData(
    new PostgreSQLBadgeHubMetadata(),
    new PostgreSQLBadgeHubFiles()
  )
) {
  if (!MQTT_CONFIG) {
    console.log("MQTT_SERVER not set so skipping MQTT publish.");
    return;
  }
  const server = MQTT_CONFIG.MQTT_SERVER;
  const username = MQTT_CONFIG.MQTT_USER;
  const password = MQTT_CONFIG.MQTT_PASSWD;
  const topic = MQTT_CONFIG.MQTT_TOPIC;
  const interval = MQTT_CONFIG.MQTT_INTERVAL_SEC;

  try {
    if (IS_DEV_ENVIRONMENT) {
      console.log("Not publishing to MQTT in development environment");
      return;
    }

    if (process.env.NODE_APP_INSTANCE !== "0") {
      return;
    }
    console.log("MQTT: ready to connect");

    let client = mqtt.connect(server, {
      username,
      password,
      clean: true,
    });

    async function sendMqttMessage() {
      const stats = await badgeHubData.getStats();

      console.log("MQTT: send message");
      try {
        client.publish(topic, JSON.stringify(stats), { qos: 1, retain: true });
      } catch (error) {
        console.error(`MQTT: error publishing message`, error);
      }
    }

    client.on("connect", async () => {
      console.log("MQTT: connected to server");

      sendMqttMessage();
      setInterval(sendMqttMessage, Number(interval) * 1000);
    });
  } catch (error) {
    console.error(`MQTT: error connecting to server ${server}`, error);
  }
}
