package com.DocSystem.common;

public class HitPosition 
{
    public final int start;
    public final int end;
    public final String term;
    
    public HitPosition(int start, int end, String term) {
        this.start = start;
        this.end = end;
        this.term = term;
    }
}
