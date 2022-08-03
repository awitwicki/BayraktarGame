using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BayraktarGameBot
{
    public static class Games
    {
        public static ConcurrentDictionary<string, GameEntity> GamesDict = new ConcurrentDictionary<string, GameEntity>();
    }

    public class GameEntity
    {
        public DateTime StartedUtc { get; set; }
        public string Guid { get; set; }
        public long UserId { get; set; }
        public string InlineMessageId { get; set; }
    }
}
