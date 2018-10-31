
var request = require('request')
var fs = require('fs')
var path = require('path')

const publickDir = "./public"
let form = {
    "tickets": "jwt:eyJhbGciOiJSUzI1NiJ9.eyJpZCI6IjgwODAxMTUiLCJpYXQiOjE1MzA1MzEzMzQ5MjEsImp0aSI6IjAyNzc1OWEyYzhkYTQ2MTRiOGE1ODFlYzRiZDIwMWY2In0.Ja1g8J54pUfoqapHpr3yPLCa7SoHxwKEDrSVeHD9vlr-LYNow80bbIt6EkoHvrTR9zYzd2qGVpWmeZR4nYQajbGqn-bOPORllfuB_tvznJcwZeKqI-sLRMhBWVghSGVRPJFoEHfTQTo20B4cZ_K1O0oRJQfdnGb_PWoT3cYmKPE",
    "_ENV_": {
        "source": "weixin",
        "app_version": "2.5.4",
        "net": ""
    },
    "source": "weixin",
    "source_origin": "weixin",
    "ssu_id": 0,
    "salt_sign": "19DAD151F39CF90FD9CA3AD0EB234B8F,74,1530876496963"
}
let time = 100;
let appFile = ''
let batFile = ''

start()
copyFile()
function copyFile(){
    fs.readFile( 'app.js' , function(err,data){
        if(err){
            console.log(err)
        }else{
            if(data.toString()){
                appFile = data.toString()
            }
        }

    });
    fs.readFile( 'bat.bat' , function(err,data){
        if(err){
            console.log(err)
        }else{
            if(data.toString()){
                batFile = data.toString()
            }
        }

    });
}


//生成一级菜品
console.log("---------开始爬数据----------")
function start() {
    request.post(
        {
            url:'https://online.yunshanmeicai.com/mall/api/commodity/saleclass', 
            form: form
        }, function(error,httpResponse,body){
            let datas = JSON.parse(body).data;
            if(datas.length > 0){
                for(let k in datas){
                    let key = datas[k];
                    if(key.name && key.id){
                        let path = publickDir +'/' + reName(key.name)
                        // let path = publickDir +'/' + key.id + '_' + reName(key.name)
                        if (!fs.existsSync(path)) {
                            if (mkdirSync(path)) {
                                fs.mkdir(path,function(err){
                                    saleclass2(key.id,path)
                                });  
                            }
                        }
                    }
                }
            }
        }
    )
}
//二级目录
// saleclass2(1,"新鲜蔬菜")
function saleclass2(first_id,firstPath) {
    setTimeout(() => {
        form.parent_id = first_id
        request.post(
            {
                url:'https://online.yunshanmeicai.com/mall/api/commodity/saleclass', 
                form: form
            }, function(error,httpResponse,body){
                let datas = JSON.parse(body).data;
                if(datas.length > 0){
                    for(let k in datas){
                        let key = datas[k]
                        if(key.name && typeof key.id == 'number' && key.parent_id == first_id){
                            let path = firstPath + '/' + reName(key.name)
                            // let path = firstPath + '/' + key.id + '_' + reName(key.name)
                            if (mkdirSync(firstPath)) {
                                fs.mkdir(path,function(err){
                                    getsearchlist(key,path)
                                });  
                            }
                        }
                    }
                }
            }
        )
    },time);
}
//菜品列表
function getsearchlist(second,secondPath) {
    setTimeout(() => {
        form.page = 1
        form.size = 100
        form.sale_c2_id = second.id
        request.post(
            {
                url:'https://online.yunshanmeicai.com/mall/api/search/getsearchlistbyc2', 
                form: form
            }, function(error,httpResponse,body){
                if(IsJsonString(body)){
                    let datas = JSON.parse(body).data;
                    if(IsJsonString(JSON.stringify(datas))){
                        if(datas && datas.rows.length > 0 ){
                            let rows = datas.rows;
                            for(let k in rows){
                                let key  = rows[k];
                                if(key.name && key.sku_id){
                                    let path = secondPath + '/'+ reName(key.name);
                                    // let path = secondPath + '/' + key.sku_id + '_' + reName(key.name);
                                    if (mkdirSync(secondPath)) {
                                        fs.mkdir(path,function(err){
                                            // mkAppjs(key.sku_id,path)
                                            mkAppjs(key.unique_id,path)
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        )
    },time);
}
function mkAppjs(sku_id,thirdPath) {
    let hostdir = thirdPath + '/';
    //文件（参数规格）
    let txtPath = hostdir +'//id.txt';
    let txt = sku_id;
    if (!fs.existsSync(txtPath)) {
        if (mkdirSync(hostdir)) {
            fs.writeFile(txtPath, txt, function(err) {
                console.log(txtPath+"----OK");
            });
        }
    }
    // copyFile
    let appPath = hostdir +'//app.js';
    let appTxt = appFile;
    if (!fs.existsSync(appPath)) {
        if (mkdirSync(hostdir)) {
            fs.writeFile(appPath, appTxt, function(err) {
                console.log(appPath+"----OK");
            });
        }
    }
    // copyFile
    let batPath = hostdir +'//bat.bat';
    let barTxt = batFile;
    if (!fs.existsSync(batPath)) {
        if (mkdirSync(hostdir)) {
            fs.writeFile(batPath, barTxt, function(err) {
                console.log(batPath+"----OK");
            });
        }
    }
}
//检测是否为全格的json
function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
//过渡不能命名的文件名称
function reName(name) {
    return name.replace(/\s+/g,"").replace(/\\|\/|\<|\"|\>|\||\:|\*|\?/g,"-")
}
//创建文件夹
function mkdirSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
    return false
}