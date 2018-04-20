package util.WebUploader;

import org.springframework.web.multipart.MultipartFile;

public class MultipartFileParam {
    private String uid;
    //任务ID
    private String id;
    //总分片数量
    private int chunks;
    //当前为第几块分片
    private int chunk;
    //文件总大小(单位字节)
    private long size = 0L;
    //文件名
    private String name;
    //分片对象
    private MultipartFile file;

    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public int getChunks() {
        return chunks;
    }

    public void setChunks(int chunks) {
        this.chunks = chunks;
    }

    public int getChunk() {
        return chunk;
    }

    public void setChunk(int chunk) {
        this.chunk = chunk;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public MultipartFile getFile() {
        return file;
    }

    public void setFile(MultipartFile file) {
        this.file = file;
    }
}