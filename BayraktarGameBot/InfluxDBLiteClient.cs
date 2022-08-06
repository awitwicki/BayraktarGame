using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BayraktarGameBot
{
    internal class InfluxDBLiteClient
    {
        public static void Query(string query)
        {
            string influxDbQuery = Environment.GetEnvironmentVariable("BARAKTARBOT_INFLUX_QUERY")!;

            if (influxDbQuery != null)
            {
                new Task(() =>
                {
                    try
                    {
                        using (var client = new System.Net.Http.HttpClient())
                        {
                            client.BaseAddress = new Uri(influxDbQuery);
                            client.Timeout = TimeSpan.FromSeconds(1);
                            var content = new System.Net.Http.StringContent(query, Encoding.UTF8, "application/Text");
                            var res = client.PostAsync("", content).Result;
                            var tt = res.Content.ReadAsStringAsync().Result;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"query: {query}");
                        Console.WriteLine(ex);
                    }
                }).Start();
            }
        }
    }
}
