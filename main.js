/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
'use strict';

const utils = require('@iobroker/adapter-core');
const axios = require('axios');
const adapterName = require('./package.json').name.split('.').pop();

class Luftdaten extends utils.Adapter {

    constructor(options) {
        super({
            ...options,
            name: adapterName,
        });

        this.killTimeout = null;

        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    async onReady() {
        const hostAddress = this.config.hostAddress;
        const hostPort = this.config.hostPort;

        this.log.info('hostAddress= ' + hostAddress);
        this.log.info('hostPort= ' + hostPort);

        await this.setObjectNotExistsAsync('getData', {
            native: {}
        });
        await this.setObjectNotExistsAsync('matrixInfo', {
            native: {}
        });

        if(hostAddress && hostPort){
            this.log.info('starting request...');

            var getParameter = ['cloudAnimations', 'installedApps', 'appList', 'settings', 'version', 'uptime', 'powerState', 'log', 'matrixInfo'];


            for(var i=0;i<getParameter.length;i++){
                axios({
                    method: 'post',
                    baseURL: 'http://' + hostAddress + ':' + hostPort,
                    url: '/api/v3/basics',
                    responseType: 'json',
                    data: {
                        get: getParameter[i]
                    }
                }).then(
                    async (response) => {
                        const content = response.data;
                        this.log.info('resposne: ' + JSON.stringify(content));
                        
                        await this.setObjectNotExistsAsync('getData.' + getParameter[i], {
                            type: 'state',
                            common: {
                                name: getParameter[i],
                                type: 'string',
                                role: 'json',
                                read: true,
                                write: false
                            },
                            native: {}
                        });
                        this.setState('getData.' + getParameter[i], {val: JSON.stringify(content), ack: true});
                    }
                ).catch(
                    (error) => {
                        if (error.response) {
                            this.log.warn('received error ' + error.response.status + ' response from local sensor ' + sensorIdentifier + ' with content: ' + JSON.stringify(error.response.data));
                        } else if (error.request) {
                            this.log.error(error.message);
                        } else {
                            this.log.error(error.message);
                        }
                    }
                );
            }
        } else {
            this.killTimeout = setTimeout(this.stop.bind(this), 10000);
        }
    }

    onUnload(callback) {
        try {

            if (this.killTimeout) {
                this.log.debug('clearing kill timeout');
                clearTimeout(this.killTimeout);
            }

            this.log.debug('cleaned everything up...');
            callback();
        } catch (e) {
            callback();
        }
    }
}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<ioBroker.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Luftdaten(options);
} else {
    // otherwise start the instance directly
    new Luftdaten();
}
