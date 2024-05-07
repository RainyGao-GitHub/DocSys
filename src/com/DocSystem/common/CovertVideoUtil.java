package com.DocSystem.common;

import org.bytedeco.ffmpeg.global.avcodec;
import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.FFmpegFrameRecorder;
import org.bytedeco.javacv.Frame;

//TODO: 视频转换没有问题，但是涉及的库太大将近500M，因此还是需要再优化
public class CovertVideoUtil {
    /**
     *
     * @param inputPath 输入文件路径
     * @param outputPath 输出文件路径
     * @throws FrameRecorder.Exception 异常
     */
    public static void convert(String inputPath, String outputPath, String targetFormat) throws Exception {
       try {
           FFmpegFrameGrabber frameGrabber = new FFmpegFrameGrabber(inputPath);
           frameGrabber.start();

           FFmpegFrameRecorder frameRecorder = new FFmpegFrameRecorder(outputPath, frameGrabber.getImageWidth(), frameGrabber.getImageHeight(), frameGrabber.getAudioChannels());
           frameRecorder.setFormat(targetFormat);
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
       catch (Exception e) {
           Log.error(e);
       }
    }
    
    public static void convertVideoToAvi(String inputPath, String outputPath) throws Exception {
        // 创建grabber来读取视频文件
        FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(inputPath);
        grabber.start();

        // 创建recorder来输出视频文件
        FFmpegFrameRecorder recorder = new FFmpegFrameRecorder(outputPath, grabber.getImageWidth(), grabber.getImageHeight(), grabber.getAudioChannels());
        recorder.setFormat("avi"); // 设置输出格式为AVI
        recorder.setFrameRate(grabber.getFrameRate());
        recorder.setSampleRate(grabber.getSampleRate());
        recorder.setVideoCodec(avcodec.AV_CODEC_ID_H264); // 设置视频编解码器
        recorder.setAudioCodec(avcodec.AV_CODEC_ID_MP3); // 设置音频编解码器
        recorder.start();

        // 读取并记录所有帧
        while (true) {
            Frame frame = grabber.grab();
            if (frame == null) {
                break;
            }
            recorder.record(frame);
        }

        // 关闭grabber和recorder
        grabber.stop();
        grabber.release();
        recorder.stop();
        recorder.release();
    }
    
    public static void convertMovToMp4(String inputPath, String outputPath) throws Exception {
        // 创建grabber来读取视频文件
        FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(inputPath);
        grabber.start();

        // 创建recorder来输出视频文件
        FFmpegFrameRecorder recorder = new FFmpegFrameRecorder(outputPath, grabber.getImageWidth(), grabber.getImageHeight(), grabber.getAudioChannels());
        recorder.setFormat("mp4"); // 设置输出格式为MP4
        recorder.setFrameRate(grabber.getFrameRate());
        recorder.setSampleRate(grabber.getSampleRate());
        recorder.setVideoCodec(avcodec.AV_CODEC_ID_H264); // 设置视频编解码器为H.264
        recorder.setAudioCodec(avcodec.AV_CODEC_ID_AAC); // 设置音频编解码器为AAC
        recorder.start();

        // 读取并记录所有帧
        Frame frame;
        while ((frame = grabber.grab()) != null) {
            recorder.record(frame);
        }

        // 关闭grabber和recorder
        grabber.stop();
        grabber.release();
        recorder.stop();
        recorder.release();
    }

    public static boolean convertVideoToMp4(String inputPath, String outputPath)
    {
    	boolean ret = false;
    	try 
    	{
	    	// 创建grabber来读取视频文件
	        FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(inputPath);
	        grabber.start();
	
	        // 创建recorder来输出视频文件
	        FFmpegFrameRecorder recorder = new FFmpegFrameRecorder(outputPath, grabber.getImageWidth(), grabber.getImageHeight(), grabber.getAudioChannels());
	        recorder.setFormat("mp4"); // 设置输出格式为MP4
	        recorder.setFrameRate(grabber.getFrameRate());
	        recorder.setSampleRate(grabber.getSampleRate());
	        recorder.setVideoCodec(avcodec.AV_CODEC_ID_H264); // 设置视频编解码器为H.264
	        recorder.setAudioCodec(avcodec.AV_CODEC_ID_AAC); // 设置音频编解码器为AAC
	        recorder.start();
	
	        // 读取并记录所有帧
	        Frame frame;
	        while ((frame = grabber.grab()) != null) {
	            recorder.record(frame);
	        }
	
	        // 关闭grabber和recorder
	        grabber.stop();
	        grabber.release();
	        recorder.stop();
	        recorder.release();
	        ret = true;
    	} 
    	catch (Exception e) 
    	{
    		Log.error(e);
	    }
    	return ret;
    }

    /**
     *  测试方法，指定输入文件和输出文件路径和输出文件
     * @param args
     * @throws FrameRecorder.Exception
     */
    public static void main(String[] args) throws Exception {
    	convertVideoToAvi("C:/N-20N3PF2E7EB0-Data/ragao/Desktop/IMG_7509.MOV", "C:/N-20N3PF2E7EB0-Data/ragao/Desktop/IMG_7509.avi");
    	convertVideoToMp4("C:/N-20N3PF2E7EB0-Data/ragao/Desktop/IMG_7509.MOV", "C:/N-20N3PF2E7EB0-Data/ragao/Desktop/mov.mp4");
        convertVideoToMp4("C:/N-20N3PF2E7EB0-Data/ragao/Desktop/IMG_7509.avi", "C:/N-20N3PF2E7EB0-Data/ragao/Desktop/avi.mp4");
    }
}
