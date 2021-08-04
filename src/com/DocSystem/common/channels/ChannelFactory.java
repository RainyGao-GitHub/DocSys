package com.DocSystem.common.channels;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * description
 *
 * @author rainy gao
 * @date 2021-08-4 9:42
 */
public class ChannelFactory {

    private static Map<String, Channel> channelMap = new ConcurrentHashMap<>();

    public static void register(Channel channel) {
        channelMap.put(channel.channelName(), channel);
    }

    public static Channel getByChannelName(String channelName) {
        return channelMap.get(channelName);
    }


}
