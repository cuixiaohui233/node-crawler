var express = require('express');
var superagent = require('superagent');
var cheerio = require('cheerio');
var url = require('url');
var async = require('async');
var app = express();
var xlsx = require('node-xlsx');
var fs = require('fs');

// 参数 i 为请求的页码数，包括开始也和结束页
setUrl(5);
var arr = [];
function setUrl(i) {
    console.log('开始请求数据页码数据');
    superagent.post('http://www.bidizhaobiao.com/advsearch/retrieval_list.do')
        .type('form')
        .set({
            'Content-Type':'application/x-www-form-urlencoded',
            'Referer':'http://www.bidizhaobiao.com/advsearch/retrieval_list.do',
            'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Origin':'http://www.bidizhaobiao.com',
            'User-Agent':'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36',
            'Cookie': '_ga=GA1.2.1326986473.1528248034; _gid=GA1.2.652460414.1528248034; UM_distinctid=163d2ae627be5-084581a19de6a1-795a6001-100200-163d2ae627dd3; CNZZDATA1262180001=1910445224-1528244891-null%7C1528244891; Hm_lvt_961d7fb68be6633c1c72ca3c95acd601=1528248034; letter=gd; JSESSIONID=C9D1F51DFEC04082EBA917A235A0A6EA; SessionId=C9D1F51DFEC04082EBA917A235A0A6EA; _gat=1; Hm_lpvt_961d7fb68be6633c1c72ca3c95acd601=1528283085'
        })
        .send({
            pictureId: 'B00208',
            pageNum:i,
            SearchWord:'家具'
        })
        .end(function (error, data) {
            if (error) {
                console.log('error exception occured !');
                return next(error)
            }
            var $ = cheerio.load(data.text);
            $('.content-list li a').each(function (i, el) {
                var $el = $(el);
                var _url = $el.attr('href');
                console.log('存储单个网页信息');
                arr.push(_url);
            });
            if (i < 7){
                i++;
                setUrl(i);
                return;
            }
            // 遍历 arr, 解析每个页面中需要的信息
            var jsonData = [];
            async.mapLimit(arr, 1, function (url, callback) {
                console.log('开始请求单个页面的数据');
                superagent
                    .get(url)
                    .set({
                        'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                        'Cookie': '_ga=GA1.2.1326986473.1528248034; _gid=GA1.2.652460414.1528248034; UM_distinctid=163d2ae627be5-084581a19de6a1-795a6001-100200-163d2ae627dd3; CNZZDATA1262180001=1910445224-1528244891-null%7C1528244891; Hm_lvt_961d7fb68be6633c1c72ca3c95acd601=1528248034; letter=gd; JSESSIONID=8ECAD46C5B03390CFDF1C4DF1D373D2C; _gat=1; SessionId=8ECAD46C5B03390CFDF1C4DF1D373D2C; Hm_lpvt_961d7fb68be6633c1c72ca3c95acd601=1528283161',
                        'Referer': 'http://www.bidizhaobiao.com/gjjs/B00208.html',
                        'Proxy-Connection':'keep-alive',
                        'User-Agent':'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36',
                        'dataObj': {
                            'loginId': '15698035885',
                            'password': 'xiangzu0606'
                        }
                    })
                    .end(function (err, mes) {
                        if (err) {
                            console.log("get \""+url+"\" error !"+err);
                            console.log("message info:"+JSON.stringify(mes));
                        }
                        if (mes) {
                            console.log('生成文件所需数据');
                            var $ = cheerio.load(mes.text);

                             jsonData = [
                                $('.content-title').text().trim(),
                                $('.table-info tr').eq(1).children().last().text().replace(/\s+/g,""),
                                $('.current a').eq(1).text().trim(),
                                url,
                                mes.text
                            ];
                        }
                        callback(null,jsonData);

                    })
            }, function (err, results) {

                console.log('获得数据');
                // 写 excel 表格
                var data = [
                    [
                        '标题',
                        '城市',
                        '类型',
                        '链接'
                    ]
                ];
                for(var i=0;i<results.length;i++) {
                    console.log('开始写html');
                    if(results[i]) {
                        fs.writeFileSync(results[i][3].split('/')[3],results[i][4], {'flag': 'w'});
                    }
                }
                for(var i=0;i<results.length;i++){
                    console.log('开始生成Excel数据');
                    if(results[i].length){
                        results[i][3] = 'http://localhost:63342/crawler/' + results[i][3].split('/')[3];
                        results[i][4] = '';
                    }
                }
                var excel = data.concat(results);
                var buffer = xlsx.build([
                    {
                        name: 'sheet1',
                        data: excel
                    }
                ]);

                fs.writeFileSync('test2.xlsx',buffer,{'flag':'w'});
                console.log('所有操作完成');
            })
        });



}

var server = app.listen(3008, function (req, res) {
    console.log('server is running')
    var host = server.address().address;

    var port = server.address().port;
});
