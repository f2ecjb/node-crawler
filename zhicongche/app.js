var superagent = require('superagent');
var Excel = require('exceljs');
let time = new Date()
let month = time.getMonth()+1;
month =(month<10 ? "0"+month:month); 
let todayTime = time.getFullYear() +'-'+ month +'-'+time.getDate()
let Host = 'https://subway.simba.taobao.com/rtreport/'

let cookie = 'cookie2=7ebead9faaa0dc60525e33694c48ecbe;skt=a75320fa0c57eaa4; csg=776d1cf3; JSESSIONID=A0BDF7D15D24DBD3DF1FEBDE5E7BBA78;'
getList()
function getList(){
	let url = `${Host}rptHasClickAdgroupList.htm?theDate=${todayTime}`
	superagent.post(url).set({'cookie':cookie,}).end(function(err, res) {
		if (err) {
			console.log(err)
		} else {
			if(res.body.code != '200'){
				console.log(res.body)
				return
			}
			let result = res.body.result
			getDetail(result)
		}
	})
}
function getDetail(list){
	for(let k in list){
		setTimeout(function() {
			let key  = list[k]
			getDetailCount(key,function(count){
				let url = `${Host}rptAdgroupClickList.htm?theDate=${todayTime}&campaignid=${key.campaignid}&adgroupid=${key.adgroupid}&offSet=0&pageSize=${count}`
				superagent.post(url).set({'cookie':cookie,}).end(function(err, res) {
					if (err) {
						console.log(err)
					} else {
						if(res.body.code != '200'){
							//console.log(res.body)
							return
						}
						saveXML(res.body.result,key.adgrouptitle)
						//console.log(JSON.stringify(result))
					}
				})
			})
		},1200)
	}
}
function getDetailCount(key,callback){
	let url = `${Host}rptAdgroupClickTotalCount.htm?theDate=${todayTime}&campaignid=${key.campaignid}&adgroupid=${key.adgroupid}`
	superagent.post(url).set({'cookie':cookie,}).end(function(err, res) {
		if (err) {
			console.log(err.status)
		} else {
			if(res.body.code != '200'){
				//console.log(res.body)
			}
			let result = res.body.result
			callback(result)
		}
	});
}
function saveXML(data,title){
	var workbook = new Excel.Workbook();

	//add header
	var ws1 = workbook.addWorksheet(title);
  
	ws1.addRow(["竞口ID", "广告组ID", "关键词", "省份", "城市","点击时间","费用","设备"]);

	for(let k in data){
		let key = data[k]
		ws1.addRow([
			key.campaignid,
			key.adgroupid,
			key.source,
			key.provincename,
			key.cityname,
			key.clickTimeStr,
			key.cost/100,
			key.fromPcOrMobile == '0' ? '手机':'电脑'
		])
	}
	let titleName = todayTime + '__'+ data.length +'__' +title
	workbook.xlsx.writeFile(titleName+'.xlsx').then(function(){
		console.log(titleName+'表格生成成功！');
	});
}
