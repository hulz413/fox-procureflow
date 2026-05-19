UPDATE approval_records
SET comment_text = CASE
    WHEN comment_text = 'browser verification approval' THEN '浏览器验证一审通过'
    WHEN comment_text = 'browser verification finance approval' THEN '浏览器验证财务通过'
    ELSE comment_text
END
WHERE comment_text IN ('browser verification approval', 'browser verification finance approval');
