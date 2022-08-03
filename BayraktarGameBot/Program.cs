using BayraktarGameBot;
using Telegram.Bot;
using Telegram.Bot.Exceptions;
using Telegram.Bot.Extensions.Polling;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using uPLibrary.Networking.M2Mqtt;
using uPLibrary.Networking.M2Mqtt.Messages;

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

// MQTT logic
{
    // Create client instance 
    MqttClient client = new MqttClient("broker.hivemq.com");

    // Register to message received 
    client.MqttMsgPublishReceived += _client_MqttMsgPublishReceived;

    string clientId = Guid.NewGuid().ToString();
    client.Connect(clientId);

    // Subscribe to the topic "/h3twergwergome/temperature" with QoS 2 
    client.Subscribe(new string[] { "/h3twergwergome/temperature" }, new byte[] { MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE });
}

static void _client_MqttMsgPublishReceived(object sender, MqttMsgPublishEventArgs e)
{
    var byteArray = e.Message;
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
}

// Bot logic
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
            //await botClient.AnswerCallbackQueryAsync(update.CallbackQuery.Id, url: $"https://127.0.0.1:5500/docs/?gameid={gameEntity.Guid}");
        }

        if (update.Message?.Text == "/start")
        {
            
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
