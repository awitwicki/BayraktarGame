using BayraktarGameBot;
using MQTTnet;
using MQTTnet.Client;
using System.Security.Authentication;
using Telegram.Bot;
using Telegram.Bot.Exceptions;
using Telegram.Bot.Extensions.Polling;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Telegram.Bot.Types.ReplyMarkups;


// MQTT
{
    string topicName = "h3twergwergomemperature";

    var mqttFactory = new MqttFactory();

    var mqttClient = mqttFactory.CreateMqttClient();

    var mqttClientOptions = new MqttClientOptionsBuilder()
        .WithWebSocketServer("test.mosquitto.org:8081")
        .WithTls(
            o =>
            {
            // The used public broker sometimes has invalid certificates. This sample accepts all
            // certificates. This should not be used in live environments.
            o.CertificateValidationHandler = _ => true;

            // The default value is determined by the OS. Set manually to force version.
            o.SslProtocol = SslProtocols.Tls12;
            })
        .Build();

    // Setup message handling before connecting so that queued messages
    // are also handled properly. When there is no event handler attached all
    // received messages get lost.
    mqttClient.ApplicationMessageReceivedAsync += e =>
    {
        Console.WriteLine("Received application message.");
        var byteArray = e.ApplicationMessage.Payload;
        string dataStr = System.Text.Encoding.UTF8.GetString(byteArray);

        // DataStr is structured string
        // GameId|Score|
        // BAaAYE|   36|

        Console.WriteLine(dataStr);

        string gameId = dataStr.Split("|").First();

        int score = int.Parse(dataStr.Split("|").Skip(1).First());

        // Check the score
        if (Games.GamesDict.TryRemove(gameId, out GameEntity gameEntity))
        {
            BotClientBuilder.BotClient.SetGameScoreAsync(gameEntity.UserId, score, gameEntity.InlineMessageId, true).Wait();
        }

        return Task.CompletedTask;
    };

    await mqttClient.ConnectAsync(mqttClientOptions, CancellationToken.None);

    var mqttSubscribeOptions = mqttFactory.CreateSubscribeOptionsBuilder()
        .WithTopicFilter(f => { f.WithTopic(topicName); })
        .Build();

    await mqttClient.SubscribeAsync(mqttSubscribeOptions, CancellationToken.None);
}

// Bot logic
string botToken = Environment.GetEnvironmentVariable("BARAKTARBOT_TELEGRAM_TOKEN")!;

var bot = new TelegramBotClient(botToken);

bot.StartReceiving(
    HandleUpdateAsync,
    HandleErrorAsync,
    new ReceiverOptions
    {
        AllowedUpdates = { },
        ThrowPendingUpdates = true
    });

var me = bot.GetMeAsync().GetAwaiter().GetResult();

Console.WriteLine($"Start listening bot for @{me.Username}");

BotClientBuilder.BotClient = bot;

async Task HandleUpdateAsync(ITelegramBotClient botClient, Update update, CancellationToken cancellationToken)
{
    try
    {
        if (update.Type == UpdateType.CallbackQuery && update.CallbackQuery!.IsGameQuery)
        {
            var id = update.CallbackQuery!.Id;
            var userId = update.CallbackQuery!.From.Id;
            var chatId = update.CallbackQuery?.Message?.Chat?.Id;
            var messageId = update.CallbackQuery?.Message?.MessageId;
            var inlineMessageId = update.CallbackQuery!.InlineMessageId;
            var chatInstance = update.CallbackQuery!.ChatInstance;

            // Register new game entity
            GameEntity gameEntity = new GameEntity
            {
                StartedUtc = DateTime.UtcNow,
                Guid = Guid.NewGuid().ToString(),
                UserId = userId,
                //ChatId = chatId,
                //MessageId = messageId,
                InlineMessageId = inlineMessageId
            };

            Games.GamesDict.TryAdd(gameEntity.Guid, gameEntity);

            await botClient.AnswerCallbackQueryAsync(update.CallbackQuery.Id, url: $"https://awitwicki.github.io/BayraktarGame/?gameid={gameEntity.Guid}");
        }

        if (update.Message?.Text == "/start")
        {
            
            var keyboardMarkup = new InlineKeyboardMarkup(new InlineKeyboardButton[] {
                        InlineKeyboardButton.WithUrl("Обрати чат для гри", "t.me/pizdiuk_bot?game=Bayraktar"),
                    });

            string responseText = $"Це бот для гри в байрактар";

            Message helloMessage = await botClient.SendTextMessageAsync(
                    chatId: update.Message.Chat.Id,
                    replyToMessageId: update.Message.MessageId,
                    text: responseText,
                    replyMarkup: keyboardMarkup);
        }
    }
    catch (Exception exception)
    {
        await HandleErrorAsync(botClient, exception, cancellationToken);
    }
}

Task HandleErrorAsync(ITelegramBotClient botClient, Exception exception, CancellationToken cancellationToken)
{
    var ErrorMessage = exception switch
    {
        ApiRequestException apiRequestException
            => $"Telegram API Error:\n[{apiRequestException.ErrorCode}]\n{apiRequestException.Message}",
        _ => exception.ToString()
    };

    Console.WriteLine(ErrorMessage);
    Console.WriteLine(exception.StackTrace);

    return Task.CompletedTask;
}

// Wait for ethernity
await Task.Delay(-1);
