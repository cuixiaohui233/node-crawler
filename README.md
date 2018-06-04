### 用node写爬虫

>启动 

首先修改 app.js 文件，因为没有在创建之前先将.xlsx文件删除，所以回报错，修改最后生成的.xlsx的名字即可

- npm i
- 打开terminal
- node app.js

>可以说是贼简单了，但是搞了一晚上,其中的坑主要是请求表单的数据，需要在请求时设置type，代码片段：

    superagent.post('http://www.bidizhaobiao.com/advsearch/retrieval_list.do')
      .type('form')// 这里需要设置 .type ,否则下面 .send 里面的参数不起作用
      .set({
          'Referer':'http://www.bidizhaobiao.com/advsearch/retrieval_list.do',
          'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
      })
      .send({
          pictureId: 'B00208',
          pageNum:1,
          SearchWord:'家具'
      })
      .end(function (error, data) {
        xxoo
      }
      
其他的就没啥了

事实证明是我想错了，请求数据少了还好，一多了，简直爆炸，各种问题...网站不是吃素的...
