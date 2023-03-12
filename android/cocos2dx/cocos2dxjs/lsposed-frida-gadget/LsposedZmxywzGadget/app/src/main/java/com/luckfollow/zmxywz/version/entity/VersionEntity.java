package com.luckfollow.zmxywz.version.entity;

public class VersionEntity {
    private int size;
    private String version;
    private String content;
    private String address;
    private String signature;
    private String token;

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    @Override
    public String toString() {
        return "VersionEntity{" +
                "size=" + size +
                ", version='" + version + '\'' +
                ", content='" + content + '\'' +
                ", address='" + address + '\'' +
                ", signature='" + signature + '\'' +
                ", token='" + token + '\'' +
                '}';
    }
}
