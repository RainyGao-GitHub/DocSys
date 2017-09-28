package util;


public class FTException extends RuntimeException{
	/**
	 * 
	 */
	private static final long serialVersionUID = -4041137622485076928L;
	
	public FTException(String msg){
		super(msg);
	}
	
    public FTException(String message, Throwable cause) {
        super(message, cause);
    }
}