package com.example.demo.utils;


import lombok.extern.slf4j.Slf4j;
import org.bytedeco.javacv.*;

@Slf4j
public class CovertVideoUtil {
    public static void convert(String inputPath, String outputPath) throws FrameRecorder.Exception {
       try {
           FFmpegFrameGrabber frameGrabber = new FFmpegFrameGrabber(inputPath);
           frameGrabber.start();

           FFmpegFrameRecorder frameRecorder = new FFmpegFrameRecorder(outputPath, frameGrabber.getImageWidth(), frameGrabber.getImageHeight(), frameGrabber.getAudioChannels());
           frameRecorder.setFormat("mp4");
           frameRecorder.setFrameRate(frameGrabber.getFrameRate());
           frameRecorder.setSampleRate(frameGrabber.getSampleRate());
           frameRecorder.start();

           Frame frame;
           while ((frame = frameGrabber.grabFrame()) != null) {
               frameRecorder.record(frame);
           }

           frameRecorder.stop();
           frameGrabber.stop();
       }
       catch (FrameGrabber.Exception e) {
           log.error("convert video failed", e);
       }
    }

    /**
     *  测试方法，指定输入文件和输出文件路径和输出文件
     * @param args
     * @throws FrameRecorder.Exception
     */
    public static void main(String[] args) throws FrameRecorder.Exception {
        CovertVideoUtil.convert("E:\\video\\fa93eb9f-3d00-460a-a9be-34e4dd4f24e7.avi", "E:\\video\\output.mp4");
    }
}
