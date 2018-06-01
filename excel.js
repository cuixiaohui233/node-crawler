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
            console.log('asdfasfd');
            var $ = cheerio.load(data.text);
            $('.content-list li a').each(function (i, el) {
                var $el = $(el);
                var _url = $el.attr('href');
                arr.push(_url);
            });
            if (i < 1){
                i++;
                setUrl(i);
                return;
            }
            // console.log(arr);
            // // 遍历 arr, 解析每个页面中需要的信息
            async.mapLimit(arr, 3, function (url, callback) {
                superagent
                    .get(url)
                    .set({
                        'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                        'Cache-Control': {'max-age': 0},
                        'Cookie': 'UM_distinctid=163b4304eeb180-071ce37af0321b-336e7707-1fa400-163b4304eed86; letter=gd; _ga=GA1.2.1770130625.1527758383; _gid=GA1.2.379592416.1527758383; Hm_lvt_961d7fb68be6633c1c72ca3c95acd601=1527757844,1527758383,1527758388,1527758526; CNZZDATA1262180001=1406415779-1527733081-null%7C1527836889; JSESSIONID=2394DBAC1358B2AF1C426597CDC9615D; _gat=1; SessionId=2394DBAC1358B2AF1C426597CDC9615D; Hm_lpvt_961d7fb68be6633c1c72ca3c95acd601=1527851774',
                        'userType': 02,
                        'Proxy-Connection':'keep-alive',
                        'dataObj': {
                            'loginId': '15931662302',
                            'password': 'lyp82nlf'
                        }
                    })
                    .end(function (err, mes) {
                        if (err) {
                            console.log("get \""+url+"\" error !"+err);
                            console.log("message info:"+JSON.stringify(mes));
                        }
                        var $ = cheerio.load(mes.text);
                        if (!$) return;

                        var jsonData = [
                            $('.content-title').text().trim(),
                            $('.table-info tr').eq(1).children().last().text().replace(/\s+/g,""),
                            $('.current a').eq(1).text().trim(),
                            url,
                            mes.text
                        ];
                        callback(null,jsonData);
                    })
            }, function (err, results) {

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
                var buffer = xlsx.build([
                    {
                        name: 'sheet1',
                        data: excel
                    }
                ]);
                console.log(results[4][4])
                for(var i=0;i<results.length;i++) {
                    fs.writeFileSync(results[i][3].split('/')[3],results[4][4], {'flag': 'w'});
                }
                fs.writeFileSync('test3.xlsx',buffer,{'flag':'w'});
            })
        });



}

// superagent.post('http://www.bidizhaobiao.com/advsearch/retrieval_list.do')
//     .type('form')
//     .set({
//         'Referer':'http://www.bidizhaobiao.com/advsearch/retrieval_list.do',
//         'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
//     })
//     .send({
//         pictureId: 'B00208',
//         pageNum:1,
//         SearchWord:'家具'
//     })
//     .end(function (error, data) {
//         if (error) {
//             console.log('error exception occured !');
//             return next(error)
//         }
//         var $ = cheerio.load(data.text);
//         var arr = [];
//         $('.content-list li a').each(function (i, el) {
//             var $el = $(el);
//             var _url = $el.attr('href');
//             arr.push(_url);
//         });
//         // // 遍历 arr, 解析每个页面中需要的信息
//         async.mapLimit(arr, 3, function (url, callback) {
//             superagent.get(url).end(function (err, mes) {
//                 if (err) {
//                     console.log("get \""+url+"\" error !"+err);
//                     console.log("message info:"+JSON.stringify(mes));
//                 }
//                 var $ = cheerio.load(mes.text);
//                 var jsonData = [
//                     $('.content-title ').text().trim(),
//                     url
//                 ];
//                 callback(null,jsonData);
//             })
//         }, function (err, results) {
//
//             // 写 excel 表格
//             var data = [
//                 [
//                     '公司',
//                     '链接'
//                 ]
//             ];
//             var excel = data.concat(results);
//             console.log(excel);
//             var buffer = xlsx.build([
//                 {
//                     name: 'sheet1',
//                     data: excel
//                 }
//             ]);
//             fs.writeFileSync('test.xlsx',buffer,{'flag':'w'});
//         })
//     });


var server = app.listen(3000, function (req, res) {
    console.log('server is running')
    var host = server.address().address;

    var port = server.address().port;
});
