console.log('Running...');


var WebInfo = {
    getData: async function(){
        var data = {};
        
        await (async () => { try{
            //TODO: parse user agent
            data['general'] = {};
            data['general'].userAgent = navigator.userAgent || '[empty userAgent]';
            data['general'].referer = document.referer || '[direct navigation]';
        }catch(e){console.warn(e)} })();
        
        await (async () => { try{
            data['screen'] = {};
            data['screen'].width = `${window.screen.width} pixels`;
            data['screen'].height = `${window.screen.height} pixels`;
            data['screen'].pixelDepth = `${window.screen.pixelDepth} bits / pixel`;
        }catch(e){console.warn(e)} })();
        
        await (async () => { try{
            var canvas = document.createElement('canvas');
            document.body.appendChild(canvas);
            var gl = canvas.getContext('experimental-webgl');
            var debugRendererInfo = gl.getExtension('WEBGL_debug_renderer_info');
            data['GPU'] = {};
            data['GPU'].renderer = gl.getParameter(debugRendererInfo.UNMASKED_RENDERER_WEBGL) || '[unknown renderer]';
            data['GPU'].vendor = gl.getParameter(debugRendererInfo.UNMASKED_VENDOR_WEBGL) || '[unknown vendor]';
        }catch(e){console.warn(e)} })();
        
        await (async () => { try{
            try{
                data['battery'] = {};
                var batteryInfo = await navigator.getBattery();
                data['battery']['charging'] = batteryInfo.charging ? 'yes' : 'no';
                data['battery']['level'] = `${batteryInfo.level * 100}%`;
            }catch(e){
                data['battery'] = '[no battery or access denied]';
            }
        }catch(e){console.warn(e)} })();

        await (async () => { try{
            data['CPU'] = {};
            data['CPU'].platform = navigator.platform;
            data['CPU'].cores = `${navigator.hardwareConcurrency} cores` || '[unknown]';
            data['CPU'].oscpu = navigator.oscpu || '[unknown]';
        }catch(e){console.warn(e)} })();

        await (async () => { try{
            data['sensors'] = {};
            return new Promise((resolve, reject) => {
                window.addEventListener('deviceorientation', function(event){
                    data['sensors'].absolute = event.absolute;
                    if(event.alpha){
                        data['sensors'].alpha = event.alpha;
                        data['sensors'].beta = event.beta;
                        data['sensors'].gamma = event.gamma;
                    }
                    data['sensors'].position = 
                        (Math.abs(event.beta) + Math.abs(event.gamma) < 5)
                        ? 'stable' : 'moving around';
                    window.removeEventListener('deviceorientation', this);
                    resolve();
                });
                setTimeout(function(){
                    if(data['sensors'].absolute === undefined)
                        data['sensors'] = '[no accelerometer or access denied]';
                    resolve();
                }, 100);
            })
        }catch(e){console.warn(e)} })();

        return data;
    }
};


export { WebInfo };
