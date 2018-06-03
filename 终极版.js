var express = require('express');
var superagent = require('superagent');
var cheerio = require('cheerio');
var url = require('url');
var async = require('async');
var app = express();
var xlsx = require('node-xlsx');
var fs = require('fs');

setUrl(1);
var arr = [];
function setUrl(i) {
    superagent.post('http://www.bidizhaobiao.com/advsearch/retrieval_list.do')
        .type('form')
        .set({
            'Referer':'http://www.bidizhaobiao.com/advsearch/retrieval_list.do',
            'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
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
                arr.push(_url);
            });
            if (i < 50){
                i++;
                console.log(i);
                setUrl(i);
                return;
            }
            // 遍历 arr, 解析每个页面中需要的信息
            async.mapLimit(arr, 3, function (url, callback) {
                superagent
                    .get(url)
                    .set({
                        'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                        'Cache-Control': {'max-age': 0},
                        'Cookie': '_ga=GA1.2.2038925468.1527781640; UM_distinctid=163b72c7dfaf0-079683703323a1-4441082e-100200-163b72c7dff527; _gid=GA1.2.1429068574.1528024560; Hm_lvt_961d7fb68be6633c1c72ca3c95acd601=1527781641,1528024560; JSESSIONID=FB80A210CCD2977A44649181F1293380; SessionId=FB80A210CCD2977A44649181F1293380; CNZZDATA1262180001=1757714797-1527786196-http%253A%252F%252Fwww.bidizhaobiao.com%252F%7C1528021526; letter=gd; tp=1; Hm_lpvt_961d7fb68be6633c1c72ca3c95acd601=1528024805',
                        'userType': 02,
                        'Proxy-Connection':'keep-alive',
                        'dataObj': {
                            'loginId': '18611789702',
                            'password': 'lyp82nlf'
                        }
                    })
                    .end(function (err, mes) {
                        if (err) {
                            console.log("get \""+url+"\" error !"+err);
                            console.log("message info:"+JSON.stringify(mes));
                        }
                        if (mes) {
                            var $ = cheerio.load(mes.text);

                            // url = 'http://localhost:63342/crawler/' + url.split('/')[3];
                            var jsonData = [
                                $('.content-title').text().trim(),
                                $('.table-info tr').eq(1).children().last().text().replace(/\s+/g,""),
                                $('.current a').eq(1).text().trim(),
                                url,
                                // mes.text
                            ];
                        }
                        console.log(jsonData);
                        callback(null,jsonData);

                    })
            }, function (err, results) {

                console.log(results);
                // 写 excel 表格
                var data = [
                    [
                        '标题',
                        '城市',
                        '类型',
                        '链接',
                    ]
                ];
                var excel = data.concat(results);
                console.log(results);
                // for(var i=0;i<results.length;i++) {
                //     console.log('开始写html');
                //     fs.writeFileSync(results[i][3].split('/')[3],results[4][4], {'flag': 'w'});
                // }
                for(var i=0;i<excel.length;i++){
                    excel[i][3] = 'http://localhost:63342/crawler/' + excel[i][3].split('/')[3];
                    console.log(excel[i][3]);
                }
                var buffer = xlsx.build([
                    {
                        name: 'sheet1',
                        data: excel
                    }
                ]);

                fs.writeFileSync('test3.xlsx',buffer,{'flag':'w'});
                console.log('完成')
            })
        });



}

var server = app.listen(3000, function (req, res) {
    console.log('server is running')
    var host = server.address().address;

    var port = server.address().port;
});
