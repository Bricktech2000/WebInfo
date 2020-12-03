var WebInfo = {
    getData: async function(){
        var data = {};
        
        await (async () => { try{
            data['general'] = {};
            var currentdate = new Date(); 
            var datetime = currentdate.getDate() + "/"
                         + (currentdate.getMonth()+1)  + "/" 
                         + currentdate.getFullYear() + " @ "  
                         + currentdate.getHours() + ":"  
                         + currentdate.getMinutes() + ":" 
                         + currentdate.getSeconds();
            data['general'].datetime = datetime;
            data['general'].userAgent = navigator.userAgent || '[empty userAgent]';
            data['general'].referer = document.referer || '[direct navigation]';
            data['general'].online = navigator.onLine ? 'yes' : 'no';
            data['general'].language = navigator.language || '[access denied]';
        }catch(e){console.warn(e)} })();
        
        await (async () => { try{
            data['screen'] = {};
            data['screen'].width = `${window.screen.width} pixels`;
            data['screen'].height = `${window.screen.height} pixels`;
            data['screen'].pixelDepth = `${window.screen.pixelDepth} bits / pixel`;
            data['screen'].orientation = window.screen.width < window.screen.height ? 'portrait' : 'landscape';
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
                data['battery'] = '[access denied]';
            }
        }catch(e){console.warn(e)} })();

        await (async () => { try{
            data['CPU'] = {};
            data['CPU'].platform = navigator.platform;
            data['CPU'].cores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : '[unknown]';
            data['CPU'].oscpu = navigator.oscpu || '[unknown]';
        }catch(e){console.warn(e)} })();
        
        await (async () => { try{
            data['RAM'] = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : '[access denied]';
        }catch(e){console.warn(e)} })();

        await (async () => { try{
            data['device'] = {};
            data['device'].touchSupport = 'ontouchstart' in window || window.TouchEvent ? 'yes' : 'no';
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
                    if(data['sensors'].position === undefined)
                        data['sensors'].position = '[access denied]';
                    resolve();
                }, 100);
            })
        }catch(e){console.warn(e)} })();
        
        await (async () => { try{
            return new Promise((resolve, reject) => {
                window.addEventListener('devicelight', function(event){
                    data['sensors'].lightLevel = event.value;
                    data['sensors'].brightness = 
                        (event.value < 50)
                        ? 'dark' : 'bright';
                    window.removeEventListener('devicelight', this);
                    resolve();
                });
                setTimeout(function(){
                    if(data['sensors'].brightness === undefined)
                        data['sensors'].brightness = '[access denied]';
                    resolve();
                }, 100);
            })
        }catch(e){console.warn(e)} })();
        
        await (async () => { try{
            return new Promise((resolve, reject) => {
                window.addEventListener('userproximity', function(event){
                    data['sensors'].proximity = event.near;
                    window.removeEventListener('devicelight', this);
                    resolve();
                });
                setTimeout(function(){
                    if(data['sensors'].proximity === undefined)
                        data['sensors'].proximity = '[access denied]';
                    resolve();
                }, 100);
            })
        }catch(e){console.warn(e)} })();
        
        await (async () => { try{
            //must be initiated by a user action
            var options = { acceptAllDevices: true };
            var device = await navigator.bluetooth.requestDevice(options);
            data['bluetooth'] = {};
            data['bluetooth'].deviceName = device.name;
            data['bluetooth'].deviceId = device.id;
            data['bluetooth'].connected = device.gatt.connected ? 'yes' : 'no';
        }catch(e){console.warn(e)} })//();
        
        await (async () => { try{
            //browser asks for permission
            var text = await navigator.clipboard.readText();
            data['clipboardText'] = text;
        }catch(e){console.warn(e)} })//();

        await (async () => { try{
            var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            var type = connection.effectiveType;
            data['general'].connectionType = type;
        }catch(e){console.warn(e)} })();

        return data;
    }
};


export { WebInfo };
