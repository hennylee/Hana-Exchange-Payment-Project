

# [WebRTC] 실시간 화상 통화 어플리케이션

출처 : [WebRTC 프로그래밍 책 3장](http://www.yes24.com/Product/Goods/22942105)


## 1. 발신자의 브라우저에서 제안 생성

```
발신자(Caller) : 통화를 시작하는 사람
```

1. 먼저 웹페이지에 방문하여 `call_token`을 얻고 이를 연결하고자 하는 상대방과 공유해야 한다.

2. 브라우저는 수신자가 연결할때까지 기다린다. 

3. 수신자가 연결을 수행하면, 수신자의 브라우저는 시그널링 서버에 시그널을 보내 연결되었음을 알려야 한다. 

4. 이 시그널은 발신자의 브라우저에 보내진다. 

5. 발신자의 브라우저가 이 `caller_arrived` 시그널을 받으면, `peer_connection.createOffer()`을 호출하여 비로서 JSEP 제안/응답 과정을 시작할 수 있다. 

6. 제안이 성공적으로 생성되면, 생성된 디스크립션이 `new_description_created()`함수로 전달된다. 

7. 이것은 `peer_connection.setLocalDescription()`을 호출하여 로컬 description으로 설정한 후, 직렬화하여 시그널링 서버에 `new_description` 시그널로 전송한다. 

8. 이 시그널은 그 후 원격지 브라우저에 전달된다. 


## 2. 수신자의 브라우저에서 응답 생성

```
수신자(Callee)
```

1. 수신자가 웹페이지에 연결하면, 발신자의 브라우저는 JSEP 제안/응답 과정을 시작하고 수신자는 new_description 시그널을 받게 된다. 

2. 그러면 수신자는 peer_connection.setRemoteDescription()을 호출하여 이를 원격지의 디스크립션으로 설정하고,
이 디스크립션이 제안일 경우, peer_connection.createAnswer()을 호출하여 응답을 보낸다. 

3. new_description_created() 함수를 사용하여 이 응답을 수신자의 로컬 디스크립션으로 설정하고, 이를 new_description 시그널로 직렬화하여 다시 발신자에게 보낸다. 


## 3. 로컬 비디오 스트림 미리보기

1. 로컬 비디오 스트림을 미리보기 위해, `setup_video()` 함수를 구현한다. 

2. 이 함수에서는 `getUserMedia`를 호출하여 로컬 카메라의 비디오 스트림에 접근을 요청한다. 

3. 이 스트림이 성공적으로 설정된다면, `local_video ID`로 로컬 브라우저 페이지의 `<video>` 요소에 표시된다. 
  
4. `local_video ID`는 `webrtc_polyfill.js` 에 정의된 `connect_stream_to_src()` 함수로 구한다. 
  
5. 이 로컬 스트림의 설정이 실패하면, 사용자가 알 수 있도록 에러가 기록된다. 
  
6. 다른 코드에서 제안이나 응답의 생성을 시도하기 전에 먼저 이 함수가 호출되고 스트림이 피어 연결 오브젝트에 추가되어야 한다. 



## 4. P2P 스트림 생성

1. `set_video()`함수가 호출되고 스트림이 성공적으로 설정되면, `peer_connection.addStream(local_stream)` 함수를 사용하여 이를 `peer_connection`에 추가한다. 
  
2. 모든 `RTCPeerConnection`의 설정이 성공하면, 자동으로 원격 피어에 전송될 준비가 완료된다. 

3. 원격 피어의 스트림이 수신되면 `peer_connection.onaddstream` 핸들러가 호출된다. 

4. 이 핸들러는 `webstr_polyfill.js` 코드에 정의된 `connect_stream_to_src()` 메소드를 사용하여 `remote_video ID`로 `<video>` 요소에 스트림을 표시한다. 

5. 원격지의 스트림이 수신될 때까지 placeholder로 사용자에게 보여주는 사용자 인터페이스 화면이 있었다면, 이곳 역시 코드를 추가하여 상태를 업데이트해줄 필요가 있다. 
  


