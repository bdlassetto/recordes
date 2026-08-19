# Recordes BDL Pinheirinho

Site estático com os melhores tempos por **pista** e **categoria**
(STT, TOYO, LISTA, DTA).

`records.json` é sobrescrito automaticamente pelo servidor de corrida —
não editar à mão aqui (a próxima publicação sobrescreve).

## Resetar recordes

Tudo é feito no `records.txt` do servidor (uma linha por
pista/categoria/piloto, no formato
`pista|categoria|guid|piloto|tempo|rt|soma|data`). O servidor confere o
arquivo a cada 30s e republica o site sozinho — não precisa reiniciar
nada.

- **Zerar tudo**: apagar o arquivo (ou esvaziá-lo).
- **Zerar uma pista**: apagar as linhas que começam com o nome dela.
- **Zerar uma categoria**: apagar as linhas que contêm `|STT|`
  (ou `|TOYO|`, `|LISTA|`, `|DTA|`).
- **Tirar o tempo de um piloto** (suspeita de cheat): apagar só a
  linha dele.

O site reflete a mudança em até ~1 minuto.

Nenhum dado pessoal é publicado: o servidor descarta o GUID (Steam ID)
dos pilotos antes de gerar este JSON.
