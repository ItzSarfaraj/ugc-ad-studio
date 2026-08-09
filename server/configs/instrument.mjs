import * as Sentry from "@sentry/node"

Sentry.init({
  dsn: "https://e72d73e7104a122c25bece188277c9f4@o4511867896332288.ingest.us.sentry.io/4511867901050880",
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
  sendDefaultPii: true,
});