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
            'Connection':'keep-alive',
            'Content-Type':'application/x-www-form-urlencoded',
            'Referer':'http://www.bidizhaobiao.com/advsearch/retrieval_list.do',
            'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Origin':'http://www.bidizhaobiao.com',
            'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36',
            'Cookie': 'UM_distinctid=163b4304eeb180-071ce37af0321b-336e7707-1fa400-163b4304eed86; _ga=GA1.2.1770130625.1527758383; Hm_lvt_961d7fb68be6633c1c72ca3c95acd601=1527757844,1527758383,1527758388,1527758526; JSESSIONID=7557B9DCA72ADA20E4FDF03754309A76; _gid=GA1.2.707751905.1528076042; letter=gd; SessionId=7557B9DCA72ADA20E4FDF03754309A76; tp=1; CNZZDATA1262180001=1406415779-1527733081-null%7C1528076987; Hm_lpvt_961d7fb68be6633c1c72ca3c95acd601=1528078034'
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
                        'Cookie': 'UM_distinctid=163b4304eeb180-071ce37af0321b-336e7707-1fa400-163b4304eed86; _ga=GA1.2.1770130625.1527758383; Hm_lvt_961d7fb68be6633c1c72ca3c95acd601=1527757844,1527758383,1527758388,1527758526; JSESSIONID=7557B9DCA72ADA20E4FDF03754309A76; _gid=GA1.2.707751905.1528076042; _gat=1; CNZZDATA1262180001=1406415779-1527733081-null%7C1528071565; letter=gd; SessionId=7557B9DCA72ADA20E4FDF03754309A76; tp=1; Hm_lpvt_961d7fb68be6633c1c72ca3c95acd601=1528076077',
                        'userType': 02,
                        'Proxy-Connection':'keep-alive',
                        'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36',
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
                            console.log(mes.text);
                            var $ = cheerio.load(mes.text);

                            var jsonData = [
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

                // console.log(results);
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
                for(var i=0;i<results.length;i++) {
                    // console.log('开始写html');
                    fs.writeFileSync(results[i][3].split('/')[3],results[4][4], {'flag': 'w'});
                }
                for(var i=0;i<excel.length;i++){
                    // console.log(excel[i][3]);
                    excel[i][3] = 'http://localhost:63342/crawler/' + excel[i][3].split('/')[3];
                    // console.log(excel[i][3]);
                }
                var buffer = xlsx.build([
                    {
                        name: 'sheet1',
                        data: excel
                    }
                ]);

                fs.writeFileSync('test.xlsx',buffer,{'flag':'w'});
                console.log('完成')
            })
        });



}

var server = app.listen(3000, function (req, res) {
    console.log('server is running')
    var host = server.address().address;

    var port = server.address().port;
});
