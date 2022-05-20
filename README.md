# Пример торгового бота на JavaScript

## Описание

Пример торгового бота на JavaScript с использование [Tinkoff Invest API] (https://tinkoff.github.io/investAPI/)

Особенности

- TypeScript
- Сбор данных и торговая логика разделены
- Присутствует гибкая настройка конфигурации

## Предварительная настройка

Для начала работы следует указать следующие Environment переменные

```
TINK_TOKEN=токен для Tinkoff API V2 с полным доступом
MQ_HOST=путь к серверу RabbitMQ
```

В качестве SDK используется [Invest NodeJS grpc SDK](https://github.com/mtvkand/invest-nodejs-grpc-sdk)
[Документация от Тинькофф](https://tinkoff.github.io/investAPI/)

Чтобы настроить конфигурацию для торговли, необходимо вставить необходимые данные в файл config.json

```json
{
  "system": {
    "sandbox": {
      "ordersPollingFrequencyMs": 400
    },
    "real": {
      "ordersPollingFrequencyMs": 400
    },
    "accountId": "YOUR_ACCOUNT_ID"
  },
  "trade": [
    {
      "instrumentFigi": "YOUR_TICKER_FIGI",
      "tariffCommissionPercentage": 0.03,
      "lotSize": 1,
      "strategies": {
        "SimpleStrategy": {
          "availableMoney": 100,
          "minimalPriceGap": 0.01
        }
      }
    }
  ],
  "collect": [
    {
      "instrumentFigi": "YOUR_TICKER_FIGI",
      "interval": "1m"
    }
  ]
}
```

Расшифровка конфигурации

- ordersPollingFrequencyMs - частота опроса для режимов Sandbox, Real
- accountId - идентификатор аккаунта
- instrumentFigi - FIGI инструмента торговли
- tariffCommissionPercentage - процент комиссии
- lotSize - размер лота
- availableMoney - изначальное количество денег в режиме Sandbox
- minimalPriceGap - минимальный шаг торговли
- interval - интервал свечи

## Начало работы

Для запуска в режиме Sandbox необходимо установить переменные `isSandbox` (файлы `index.ts` в приложении market-collector, trading-core) в значение `true`. Для реальной торговли соответственно установить в значение `false`.

```sh
yarn && yarn core
```
