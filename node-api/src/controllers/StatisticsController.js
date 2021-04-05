const axios = require('axios');
const tabelaFutebolApiExample = require('../mock/tabelaFutebolApiMock');
const tabelaCartolaApiExample = require('../mock/tabelaCartolaApiMock');
const partidasCartolaApiExample = require('../mock/partidasCartolaApiMock');
require('dotenv').config();

function verificarNomeAthleticoPR(nome) {
    if (nome === "Athlético-PR")
        return "Athletico-PR"
    else return nome
}

async function cartolaApi() {
    try {
        const partidasResponse = await axios.get('https://api.cartolafc.globo.com/partidas');
        const partidasInfo = partidasResponse.data;
        const { partidas, clubes, rodada } = partidasInfo;

        const clubes_detalhes = Object.values(clubes);
        const tabelaCartola = clubes_detalhes.map(clube => {
            return {
                posicao: clube.posicao,
                nome: clube.nome,
                escudo: clube.escudos['30x30'],
            }
        });

        const partidasExibicao = partidas.map(partida => {
            const mandante_id = partida.clube_casa_id;
            const visitante_id = partida.clube_visitante_id;

            let nome_mandante = clubes[`${mandante_id}`].nome;
            const escudo_mandante = clubes[`${mandante_id}`].escudos['30x30'];
            nome_mandante = verificarNomeAthleticoPR(nome_mandante);

            let nome_visitante = clubes[`${visitante_id}`].nome;
            const escudo_visitante = clubes[`${visitante_id}`].escudos['30x30']
            nome_visitante = verificarNomeAthleticoPR(nome_visitante);

            return {
                mandante: {
                    nome: nome_mandante,
                    escudo: escudo_mandante
                },
                visitante: {
                    nome: nome_visitante,
                    escudo: escudo_visitante
                }
            };
        });

        return {
            rodada: rodada,
            tabelaCartola: tabelaCartola,
            partidasExibicao: partidasExibicao
        }
    } catch (err) {
        return err;
    }
}

async function futebolApi() {
    const campeonatosResponse = await axios.get(
        'https://api.api-futebol.com.br/v1/campeonatos/',
        {
            headers: {
                'Authorization': `Bearer ${process.env.SECRET_API}`
            }
        });

    const campeonatos = campeonatosResponse.data;

    const brasileirao = campeonatos.filter(campeonato => {
        if (campeonato['nome'] == 'Campeonato Brasileiro') {
            return campeonato;
        }
    });

    const brasileirao_id = brasileirao[0]['campeonato_id'];

    const tabelaResponse = await axios.get(
        `https://api.api-futebol.com.br/v1/campeonatos/${brasileirao_id}/tabela`,
        {
            headers: {
                'Authorization': `Bearer ${process.env.SECRET_API}`
            }
        });

    return tabelaResponse.data;
}

function tabelaExibicao(tabelaCartolaApi, tabelaFutebolApi) {
    return tabelaCartolaApi.map(elementoCartola => {
        let nomeTime = elementoCartola.nome

        nomeTime = verificarNomeAthleticoPR(nomeTime);

        const elementoApi = tabelaFutebolApi.find(elemento => {
            return nomeTime === elemento.time.nome_popular;
        });

        return {
            posicao: elementoApi.posicao,
            nome: nomeTime,
            escudo: elementoCartola.escudo,
            pontos: elementoApi.pontos,
            jogos: elementoApi.jogos,
            vitorias: elementoApi.vitorias,
            empates: elementoApi.empates,
            derrotas: elementoApi.derrotas,
            golsPro: elementoApi.gols_pro,
            golsContra: elementoApi.gols_contra,
            saldoGols: elementoApi.saldo_gols,
            ultimosJogos: elementoApi.ultimos_jogos,
        }
    }).sort((equipe, anterior) => {
        if (equipe.posicao > anterior.posicao)
            return 1;
        if (equipe.posicao < anterior.posicao)
            return -1;
    });
}

function verificaMenorSequencia(tabela) {
    tabela.sort((elemento, anterior) => {
        if (elemento.ultimosJogos.length > anterior.ultimosJogos.length)
            return 1;
        if (elemento.ultimosJogos.length < anterior.ultimosJogos.length)
            return -1;
    });

    if (tabela[0].ultimosJogos.length < 5)
        return tabela[0].ultimosJogos.length;
    else
        return 5;
}

function verificaResultado(resultado) {
    if (resultado === 'v')
        return 1;
    else if (resultado === 'd')
        return -1;
    else
        return 0;
}

module.exports = {
    getStatistics: async (req, res) => {
        try {
            const { rodada, tabelaCartola, partidasExibicao } = await cartolaApi();            
            const tabelaFutebol = await futebolApi();            
            
            const tabela = tabelaExibicao(tabelaCartola, tabelaFutebol)

            // const tabelaFutebolApi = tabelaFutebolApiExample.data;
            // const tabelaCartolaApi = tabelaCartolaApiExample.data;
            // const partidasExibicao = partidasCartolaApiExample.data;

            // const tabela = tabelaExibicao(tabelaCartolaApi, tabelaFutebolApi);
            
            let ataque = [];
            let defesa = [];

            partidasExibicao.forEach(jogo => {
                const timeMandante = jogo.mandante.nome;
                const timeVisitante = jogo.visitante.nome;

                const mandanteInfo = tabela.find(time => {
                    return time.nome === timeMandante;
                });

                const visitanteInfo = tabela.find(time => {
                    return time.nome === timeVisitante;
                });

                const pontoMandanteAtaque = 1 + rodada;
                const pontoMandanteDefesa = -1 * pontoMandanteAtaque;
                const mandanteGolsPro = mandanteInfo.golsPro;
                const mandanteGolsContra = mandanteInfo.golsContra;

                const visitanteGolsPro = visitanteInfo.golsPro;
                const visitanteGolsContra = visitanteInfo.golsContra;

                let visitantePontosAtaque = visitanteGolsPro + mandanteGolsContra;
                let visitantePontosDefesa = visitanteGolsContra + mandanteGolsPro;
                let mandantePontosAtaque = visitantePontosDefesa + pontoMandanteAtaque;
                let mandantePontosDefesa = visitantePontosAtaque + pontoMandanteDefesa;

                const menorSequencia = verificaMenorSequencia(tabela);

                for (let i = 0; i < menorSequencia; i++) {
                    const valorMandante = verificaResultado(mandanteInfo.ultimosJogos[i]);
                    const valorVisitante = verificaResultado(visitanteInfo.ultimosJogos[i]);

                    visitantePontosAtaque = visitantePontosAtaque + valorVisitante;
                    visitantePontosAtaque = visitantePontosAtaque - valorMandante;
                    visitantePontosDefesa = visitantePontosDefesa - valorVisitante;
                    visitantePontosDefesa = visitantePontosDefesa + valorMandante;

                    mandantePontosAtaque = mandantePontosAtaque + valorMandante;
                    mandantePontosAtaque = mandantePontosAtaque - valorVisitante;
                    mandantePontosDefesa = mandantePontosDefesa - valorMandante;
                    mandantePontosDefesa = mandantePontosDefesa + valorVisitante;
                }

                ataque.push({
                    nome: timeMandante,
                    pontos: mandantePontosAtaque,
                    recomendacao: 0,
                    escudo: mandanteInfo.escudo
                });

                ataque.push({
                    nome: timeVisitante,
                    pontos: visitantePontosAtaque,
                    recomendacao: 0,
                    escudo: mandanteInfo.escudo
                });

                defesa.push({
                    nome: timeMandante,
                    pontos: mandantePontosDefesa,
                    recomendacao: 0,
                    escudo: mandanteInfo.escudo
                });

                defesa.push({
                    nome: timeVisitante,
                    pontos: visitantePontosDefesa,
                    recomendacao: 0,
                    escudo: mandanteInfo.escudo
                });
            });

            ataque.sort((elemento, anterior) => {
                if (elemento.pontos < anterior.pontos)
                    return 1;
                if (elemento.pontos > anterior.pontos)
                    return -1;
            });

            defesa.sort((elemento, anterior) => {
                if (elemento.pontos > anterior.pontos)
                    return 1;
                if (elemento.pontos < anterior.pontos)
                    return -1;
            });

            for (let i = 0; i < ataque.length; i++) {
                ataque[ataque.length - 1 - i].recomendacao = i;
                defesa[defesa.length - 1 - i].recomendacao = i;
            }

            const meio = ataque.map(recomendacaoAtaque => {
                const nomeTime = recomendacaoAtaque.nome
                const elementoDefesa = defesa.find(recomendacaoDefesa => {
                    return recomendacaoDefesa.nome === nomeTime
                });
                return {
                    nome: nomeTime,
                    pontos: recomendacaoAtaque.recomendacao + elementoDefesa.recomendacao,
                    escudo: recomendacaoAtaque.escudo
                }
            }).sort((elemento, anterior) => {
                if (elemento.pontos < anterior.pontos)
                    return 1;
                if (elemento.pontos > anterior.pontos)
                    return -1;
            });

            tabela.sort((elemento, anterior) => {
                if (elemento.posicao > anterior.posicao)
                    return 1;
                if (elemento.posicao < anterior.posicao)
                    return -1;
            });

            return res.status(200).json({
                rodada: rodada,
                partidas: partidasExibicao,
                tabela: tabela.sort,
                recomendacoes: {
                    ataque: ataque,
                    defesa: defesa,
                    meio: meio
                }
            });

        } catch (err) {
            console.log(err)
            res.status(500).send();
        }
    }
}