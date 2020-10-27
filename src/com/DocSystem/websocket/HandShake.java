package com.DocSystem.websocket;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import javax.servlet.http.HttpSession;
import java.util.Map;

public class HandShake implements HandshakeInterceptor {

    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response, WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) throws Exception {

    	System.out.println("beforeHandshake");
    	ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
        String parameter = servletRequest.getServletRequest().getParameter("id");
        // 登陆时自己手动绑定的 session，非 websocket session
        HttpSession session = servletRequest.getServletRequest().getSession(false);
        System.out.println("Websocket:用户[ID:" + parameter + "]握手成功");
		System.out.println(request.getURI().toString());
		// 若要编写 websocket 客户端进行连接，则再定义一个不需要 session 的判定进行绑定
		if (session != null) {
            // 使用 userCd 区分 WebSocketHandler，以便定向发送消息
            String userCd = session.getAttribute("uid").toString();
            attributes.put("uid", userCd);
            return true;
        }
		return false;
    }

    public void afterHandshake(ServerHttpRequest request,
                               ServerHttpResponse response, WebSocketHandler wsHandler,
                               Exception exception) {
        System.out.println("After Handshake");
    }
}
