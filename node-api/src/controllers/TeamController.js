// import axios from 'axios';

const axios = require('axios');

module.exports = {
    getTeam: async (req, res) => {
        const time = req.query.team;
        
        try{
            const timeResponse = await axios.get(`https://api.cartolafc.globo.com/times?q=${time}`);            
            const timeInfo = timeResponse.data[0];   
            const timeNome = timeInfo.nome;
            const timeUrl = timeInfo.url_escudo_png;
            const timeId = timeInfo.time_id;
    
            const timeExtraResponse = await axios.get(`https://api.cartolafc.globo.com/time/id/${timeId}`);
            const timeExtraInfo = timeExtraResponse.data;
            const patrimonio = timeExtraInfo.patrimonio;
            const valorMedioPorJogador = (patrimonio / 12).toFixed(2);            

            const resposta = {
                timeNome,
                timeUrl,
                patrimonio,
                valorMedioPorJogador
            }

            return res.status(200).json(resposta);

        } catch(err) {
            console.log(`erro: ${err}`);
            return res.status(500).json({
                error: err
            });
        }
    }
}