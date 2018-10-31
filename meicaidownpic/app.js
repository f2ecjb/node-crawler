
var request = require('request')
var fs = require('fs')
var path = require('path')

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
let getCount = 0;//请求图片数量
let savaCount = 0;//成功保存图片数量
let time = 1000;
let startTime = new Date()
start()
function start(){
    fs.readFile( 'id.txt' , function(err,data){
        if(err){
            console.log(err)
        }else{
            if(data.toString()){
                getDetailData(data.toString())
            }
        }

    });
}
// getDetailData(84560)
//详情页数据
// 84560,31060,252708
// getDetailData({sku_id:252708},publickDir)
function getDetailData(sku_id) {
    form.ssu_id = sku_id;
    request.post(
        {
            url:'https://online.yunshanmeicai.com/mall/api/commodity/detail', 
            form: form,
        }, function(error,httpResponse,body){
            if(IsJsonString(body)){
                let datas = JSON.parse(body).data;
                // if(JSON.stringify(datas) != '[]' && IsJsonString(JSON.stringify(datas)) && datas.ssu && datas.ssu.ssu_id){
                if(JSON.stringify(datas) != '[]' && IsJsonString(JSON.stringify(datas))){//包含未上线的
                    downloadUrl(datas)
                }
            }
        }
    )
}
function downloadUrl(datas) {
    if(!datas.sku_image_desc || !datas.sku){
        return false;
    }
    let url,name;
    let sku_image = [];
    let hostdir = './public/';
    let image_desc = datas.sku_image_desc.image;
    if(image_desc.length > 0){
        for(let k in image_desc){
            sku_image.push(image_desc[k])
        }
    }
    if(datas.sku.sku_pics[0]){
        sku_image.push(datas.sku.sku_pics[0])
    }
    //图片
    if(sku_image.length > 0){
        for(let k in sku_image){
            getCount ++
            let key = sku_image[k];
            //最上面banner位的图片
            if(key.indexOf("?") > -1){
                url = key.split('?')[0]
                let splitArr = url.split('/')
                name = splitArr[splitArr.length - 1].split('.')[0]
            }else{
            //详情页所有图片
                url = key;
                let splitArr = key.split('/')
                name = splitArr[splitArr.length - 1].split('.')[0]
            }
            if(name && url){
                saveImage(hostdir,name,url,datas.sku.sku_id)
            }
        }
    }
    //文件（参数规格）
    let sku_level = datas.sku_level;
    if(sku_level.length > 0){
        let txtPath = hostdir +'//参数规格.txt';
        let txt = '';
        for(let k in sku_level){
            txt += sku_level[k].name + ':' + sku_level[k].value + '\r\n';
        }
        if (!fs.existsSync(txtPath)) {
            if (mkdirSync(hostdir)) {
                fs.writeFile(txtPath, txt, function(err) {
                    console.log(hostdir+"【规格参数已保存】");
                });
            }
        }
    }
    //文件（别名）
    let alias_name = datas.sku.bi_alias_name;
    if(alias_name){
        let txtPath = hostdir +'//别名.txt';
        if (!fs.existsSync(txtPath)) {
            if (mkdirSync(hostdir)) {
                fs.writeFile(txtPath, alias_name, function(err) {
                    console.log(hostdir+"【别名已保存】");
                });
            }
        }
    }
    //价格
    let price = datas.ssu.total_price +'/'+ datas.ssu.ssu_format;
    if(price){
        let txtPath = hostdir  +'//价格.txt';
        if (!fs.existsSync(txtPath)) {
            if (mkdirSync(hostdir)) {
                fs.writeFile(txtPath, price, function(err) {
                    console.log(hostdir+"【价格已保存】");
                });
            }
        }
    }
}
//保存图片
function saveImage(hostdir,name,url,sku_id) {
    setTimeout(() => {
        let imgPath = hostdir + name +'.jpg';
        if (!fs.existsSync(imgPath)) {
            if (mkdirSync(hostdir)) {

                let writeStream = fs.createWriteStream(imgPath);
                let readStream = request(url)
                readStream.pipe(writeStream);
                readStream.on('error', function(response) {
                    saveImage(hostdir,name,url,sku_id)                    
                    console.log("写入失败:",sku_id);
                });
                readStream.on('end', function(response) {
                    // console.log("写入成功");
                    writeStream.end();
                });
                writeStream.on("finish", function() {
                    savaCount ++
                    console.log("图片保存成功/请求数量:"+savaCount+"/"+getCount+"，成功率:"+ ((savaCount/getCount)*100).toFixed(2) + '%，花费时长:' + fmtDate());
                    console.log(url);
                });
            }
        }
    },time);//时间保持在1000至1500之间
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
//时长
function fmtDate(){
    let curTime = new Date();
    let differ = curTime.getTime() - startTime.getTime();
    //计算出相差天数
    let days = Math.floor(differ / (24 * 3600 * 1000));
    //计算出小时数
    let leave1 = differ % (24 * 3600 * 1000);
    let hours = Math.floor(leave1 / (3600 * 1000));
    if (days > 0) {
        hours += days * 24;
    }
    //计算相差分钟数
    let leave2 = leave1 % (3600 * 1000);
    let minutes = Math.floor(leave2 / (60 * 1000));
    //计算相差秒数
    let leave3 = leave2 % (60 * 1000);
    let seconds = Math.round(leave3 / 1000);
    return  hours +':' + minutes +':' + seconds
}