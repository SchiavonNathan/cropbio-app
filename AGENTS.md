# CropBio App - Diretrizes de Desenvolvimento

## Aplicativo Clone / White-Label
Este projeto é irmão gêmeo do **`desangosse-app`** (localizado no diretório paralelo `../desangosse-app`).
Ambos compartilham exatamente a mesma base de código, endpoints e lógica de negócios.

### Regra de Sincronização Obrigatória:
- **Toda modificação feita neste app (`cropbio-app`) DEVE ser replicada no app irmão (`../desangosse-app`).**
- **Toda modificação feita no `desangosse-app` DEVE ser replicada aqui (`cropbio-app`).**
- **Preservar Branding**: Não sobrescrever o nome "CropBio", package `com.nathanschiavon.cropbio` ou assets de `cropbio-app` com os do `desangosse-app`.
