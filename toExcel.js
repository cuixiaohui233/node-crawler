var express = require('express');
var superagent = require('superagent');
var cheerio = require('cheerio');
var url = require('url');
var async = require('async');
var app = express();
var xlsx = require('node-xlsx');
var fs = require('fs');

setUrl(101);
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
            if (i < 150){
                i++;
                setUrl(i);
                return;
            }
            console.log(arr);
            // // 遍历 arr, 解析每个页面中需要的信息
            async.mapLimit(arr, 3, function (url, callback) {
                var jsonData = [];
                superagent.post(url).end(function (err, mes) {
                    if (err) {
                        console.log("get \""+url+"\" error !"+err);
                        console.log("message info:"+JSON.stringify(mes));
                    }

                    if (mes) {
                        var $ = cheerio.load(mes.text);
                        if ($('.current a').eq(1).text().trim() == '招标公告') {
                        } else if ($('.current a').eq(1).text().trim() == '中标信息') {
                            var tr = $('#pcontent table tr');
                        }
                        jsonData = [
                            $('.content-title').text().trim(),
                            $('.table-info tr').eq(1).children().last().text().replace(/\s+/g,""),
                            $('.current a').eq(1).text().trim(),
                            url
                        ];
                    }

                    callback(null,jsonData);
                })
            }, function (err, results) {

                // 写 excel 表格
                var data = [
                    [
                        '标题',
                        '城市',
                        '类型',
                        // '用途',
                        // '联系人',
                        // '电话',
                        '链接'
                    ]
                ];
                var excel = data.concat(results);
                console.log(excel);
                var buffer = xlsx.build([
                    {
                        name: 'sheet1',
                        data: excel
                    }
                ]);
                fs.writeFileSync('bidizhaobiao1.xlsx',buffer,{'flag':'w'});
                console.log('导出完成！');
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


app.listen(3000, function (req, res) {
    console.log('server is running')
});
