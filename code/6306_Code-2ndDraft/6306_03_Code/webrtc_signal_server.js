/*

  webrtc_signal_server.js by Rob Manson

  The MIT License

  Copyright (c) 2010-2013 Rob Manson, http://buildAR.com. All rights reserved.

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.

*/

/*
    시그널 서버의 5단계
    [1단계] 웹 소켓 라이브러리 다운로드 : npm install websocket
    [2단계] app 전반에 걸쳐 사용될 일반 변수 정의
    [3단계] app을 위한 기본 웹서버의 동작을 정의
    [4단계] 시그널링 서버 app의 가장 중요한 websocket 상세 기능을 정의
    [5단계] 응용 프로그램 전반에서 사용되는 기본 유틸리티 함수를 정의

*/

// [1단계] useful libs
var http = require("http"); // http : 기본 웹서버 기능을 제공
var fs = require("fs"); // fs 패키지 : 로컬 파일 시스템에 접근하여 필요한 파일들을 읽거나 쓸 수 있게 해줌
var websocket = require("websocket").server; // websocket 패키지 : 웹소켓 서버 설정에 필요한 모든 기능을 제공


// [2단계] general variables
var port = 1234; // 수신포트
var webrtc_clients = []; // 웹소켓을 열어놓고 있는 브라우저 목록을 저장하는 배열
var webrtc_discussions = {}; // 시그널링 서버가 관리하는 통화 목록의 인덱싱 리스트를 저장하는 오브젝트 (이 오브젝트의 키는 각 발신자를 설정하는 call_tokens임)


// [3단계] web server functions
var http_server = http.createServer(function(request, response) { // createServer로 구동중인 웹서버의 정보를 알아내서 http_server 변수에 저장함
  var matches = undefined;

  if (matches = request.url.match("^/images/(.*)")) {
    var path = process.cwd()+"/images/"+matches[1];
    fs.readFile(path, function(error, data) {
      if (error) {
        log_error(error);
      } else {
        response.end(data);
      }
    });
  } else {
    response.end(page);
  }
});

// listen함수를 사용하여 http_server 변수를 선택한 포트에 바인딩함
http_server.listen(port, function() {
  log_comment("server listening (port "+port+")");
});

// respond로 반환되는 HTML 페이지의 콘텐츠를 작성
var page = undefined;
fs.readFile("basic_video_call.html", function(error, data) { // fs.readFile 함수를 사용하여 basic_video_call.html의 콘텐츠를 가져온다.
  if (error) {
    log_error(error);
  } else {
    page = data;
  }
});


// [4단계] web socket functions
// websocket 변수를 생성자로 사용하여 새로운 오브젝트를 생성하고 이를 websocket_server 변수에 할당한다. 
var websocket_server = new websocket({ 
  httpServer: http_server // http_server변수를 httpServer로 사용하도록 알린다.
});

// websocket_server(웹소켓 서버)에서 새로운 요청을 처리하는 메인 함수를 작성한다.
websocket_server.on("request", function(request) {

  log_comment("new request ("+request.origin+")");

  /*
      기본적으로 보든 새로운 요청을 수락하고, 각각을 connection변수에 할당한다. 
      => 실제 시스템에서는 새 연결에 대한 인증이나 허가 등의 기능 추가가 필요하다!!!!!!!!!!!!!!!
  */
  var connection = request.accept(null, request.origin);
  log_comment("new connection ("+connection.remoteAddress+")");

  // 새로운 연결을 webrtc_clients 배열에 넣어, 서버에 연결된 브라우저의 목록에 추가한다. 
  webrtc_clients.push(connection);
  connection.id = webrtc_clients.length-1; // 목록에서 위치를 통해 어떤 연결인지 쉽게 확인할 수 있도록 connection오브젝트의 .id 속성에 저장한다.
  
  // 웹소켓에 클라이언트에서 전송한 새 메시지를 처리하는 함수를 정의하여 시그널링 핵심 기능을 설정한다. 
  connection.on("message", function(message) {

    // 우선 필터링을 통해 utf-8 메시지만 처리함( 필요 시, 바이너리 메시지를 처리하도록 확장할 수 있음)
    if (message.type === "utf8") {
      log_comment("got message "+message.utf8Data);

      var signal = undefined;
      try { 
        signal = JSON.parse(message.utf8Data); // JSON.parse() 메소드를 사용하여 이 메세지를 파싱한다.
      } catch(e) { 
        // 에러 처리 필요!!
      };

      // (1) 시그널이 성공적으로 파싱되었다면? 시그널의 .type 속성을 사용하여 어떻게 처리할지 판단한다.
      if (signal) {

        // 1) .type 이 join이고 .token 속성을 포함하고 있다면?
        if (signal.type === "join" && signal.token !== undefined) {
          try {
            if (webrtc_discussions[signal.token] === undefined) {
              webrtc_discussions[signal.token] = {};
            }
          } catch(e) { };
          try {
            webrtc_discussions[signal.token][connection.id] = true; // 토큰을 키로 사용하여 이 연결을 webrtc_discussions 오브젝트에 추가한다.
          } catch(e) { };
        }

        // 2) .type이 다른 값을 가지고 있으면서, .token이 정의되어 있으면?
        else if (signal.token !== undefined) {
          try {
            // 메세지를 대화에 참여하고 있는 다른 연결에 전송한다.  =>  시그널을 보낸 연결에 이 시그널을 다시 재전송하지 않도록 유의해야 한다. 
            Object.keys(webrtc_discussions[signal.token]).forEach(function(id) {
              if (id != connection.id) {
                webrtc_clients[id].send(message.utf8Data, log_error);
              }
            });
          } catch(e) { };
        }

        // 3) 그 외 다른 경우에는 시그널을 유효하지 않은 것으로 처리
        else {
          log_comment("invalid signal: "+message.utf8Data);
        }
      } 

      // (2) 시그널이 성공적으로 파싱되지 않았다면?
      else {
        log_comment("invalid signal: "+message.utf8Data);
      }
    }
  });
  
  // 연결이 종료되었을 때, 처리하는 함수
  connection.on("close", function(connection) {
    log_comment("connection closed ("+connection.remoteAddress+")");    

    /*
        모든 대화 목록을 돌면서, 해당 연결이 포함되어 있는지 확인하고 필요시에만 제거한다
        => 각 connection에 오브젝트에 참여한 대화 목록을 추가하도록 확장하면, 모든 대화 목록을 확인해야 하는 과정을 줄일 수 있다!!! 
    */
    Object.keys(webrtc_discussions).forEach(function(token) {
      Object.keys(webrtc_discussions[token]).forEach(function(id) {
        if (id === connection.id) {
          delete webrtc_discussions[token][id];
        }
      });
    });
  });
});


// [5단계] utility functions
function log_error(error) {
  if (error !== "Connection closed" && error !== undefined) {
    log_comment("ERROR: "+error);
  }
}
function log_comment(comment) {
  console.log((new Date())+" "+comment);
}
