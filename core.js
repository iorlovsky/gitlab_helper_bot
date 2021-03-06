const Telegraf = require("telegraf");
const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const express = require("express")();

const { extendBot, onlyAdmin, onlyPrivate, onlyGroup } = require("./decorators");
const { TELEGRAM_TOKEN, EXPRESS_PATH, SECRET_LOCATION, SECRET_PATH, BOT_PORT, BOT_CONFIG } = require("./settings");
const { GITLAB_USERNAME_PATTERN } = require("./constants");
const commands = require("./bot_handlers/commands");
const scenes = require("./bot_handlers/scenes");
const actions = require("./bot_handlers/actions");
const logger = require("./logger");

const bot = new Telegraf(TELEGRAM_TOKEN, BOT_CONFIG);
extendBot(bot);

const stage = new Stage();
stage.command("cancel", Stage.leave());
stage.register(scenes.attach);
stage.register(scenes.deactivate);
stage.register(scenes.revoke);
stage.register(scenes.grant);
stage.register(scenes.deleteMessages);
stage.register(scenes.grantProductManager);
stage.register(scenes.revokeProductManager);
stage.register(scenes.grantTester);
stage.register(scenes.revokeTester);
stage.register(scenes.safe);
stage.register(scenes.unsafe);
stage.register(scenes.reassign);

bot.use(session());
bot.use(stage.middleware());
bot.catch(err => logger.error(err));
bot.telegram.getMe().then(botInfo => {
  bot.options.username = botInfo.username;
});

bot.start(commands.startCommand);
bot.command("attach", onlyAdmin(onlyPrivate(ctx => ctx.scene.enter("attach"))));
bot.command("deactivate", onlyAdmin(onlyPrivate(ctx => ctx.scene.enter("deactivate"))));
bot.command("revoke", onlyAdmin(onlyPrivate(ctx => ctx.scene.enter("revoke"))));
bot.command("grant", onlyAdmin(onlyPrivate(ctx => ctx.scene.enter("grant"))));
bot.command("grant_pm", onlyAdmin(onlyPrivate(ctx => ctx.scene.enter("grant_pm"))));
bot.command("revoke_pm", onlyAdmin(onlyPrivate(ctx => ctx.scene.enter("revoke_pm"))));
bot.command("grant_tester", onlyAdmin(onlyPrivate(ctx => ctx.scene.enter("grant_tester"))));
bot.command("revoke_tester", onlyAdmin(onlyPrivate(ctx => ctx.scene.enter("revoke_tester"))));
bot.command("safe", onlyAdmin(onlyPrivate(ctx => ctx.scene.enter("safe"))));
bot.command("unsafe", onlyAdmin(onlyPrivate(ctx => ctx.scene.enter("unsafe"))));
bot.command("reassign", onlyPrivate(ctx => ctx.scene.enter("reassign")));
bot.command("delete_all_messages", onlyAdmin(onlyPrivate(ctx => ctx.scene.enter("deleteMessages"))));
bot.command("update", onlyAdmin(onlyPrivate(commands.updateDatabaseFromChat)));

bot.command("activate", onlyAdmin(onlyGroup(commands.activateChat)));

bot.command("enable_notifications", onlyPrivate(commands.enableNotifications));
bot.command("disable_notifications", onlyPrivate(commands.disableNotifications));
bot.command("for_me", onlyPrivate(actions.myMergeRequests));
bot.command("report", onlyPrivate(actions.getReport));

bot.action(new RegExp(`(attach)_(${GITLAB_USERNAME_PATTERN.source})`), onlyAdmin(onlyPrivate(actions.attachUser)));
bot.action(new RegExp(`(revoke)_(${GITLAB_USERNAME_PATTERN.source})`), onlyAdmin(onlyPrivate(actions.revokeApprover)));
bot.action(new RegExp(`(grant)_(${GITLAB_USERNAME_PATTERN.source})`), onlyAdmin(onlyPrivate(actions.grantApprover)));
bot.action(
  new RegExp(`(grantpm)_(${GITLAB_USERNAME_PATTERN.source})`),
  onlyAdmin(onlyPrivate(actions.grantProductManager))
);
bot.action(
  new RegExp(`(revokepm)_(${GITLAB_USERNAME_PATTERN.source})`),
  onlyAdmin(onlyPrivate(actions.revokeProductManager))
);
bot.action(
  new RegExp(`(granttester)_(${GITLAB_USERNAME_PATTERN.source})`),
  onlyAdmin(onlyPrivate(actions.grantTester))
);
bot.action(
  new RegExp(`(revoketester)_(${GITLAB_USERNAME_PATTERN.source})`),
  onlyAdmin(onlyPrivate(actions.revokeTester))
);
bot.action(new RegExp(`(^safe)_(${GITLAB_USERNAME_PATTERN.source})`), onlyAdmin(onlyPrivate(actions.markSafe)));
bot.action(new RegExp(`(^unsafe)_(${GITLAB_USERNAME_PATTERN.source})`), onlyAdmin(onlyPrivate(actions.markUnsafe)));
bot.action(/(delete_messages)_(-\d+)/, onlyAdmin(onlyPrivate(actions.deleteAllMessages)));
bot.action(/(deactivate)_(-\d+)/, onlyAdmin(onlyPrivate(actions.deactivateChat)));

(async () => {
  try {
    if (process.env.BOT_MODE === "webhook") {
      express.use(bot.webhookCallback(EXPRESS_PATH));
      express.listen(BOT_PORT, () => {
        logger.info(`listening on port ${BOT_PORT}`);
      });
      await bot.telegram.setWebhook(SECRET_LOCATION + SECRET_PATH);
    } else {
      await bot.telegram.deleteWebhook();
      bot.startPolling();
    }
  } catch (e) {
    logger.fatal(e);
  }
})();
