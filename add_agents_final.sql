-- 添加主中介商账号
-- 密码123456的MD5加密值: e10adc3949ba59abbe56e057f20f883e

-- 1. 添加YT001中介商
INSERT INTO `agents` (
    `username`, 
    `password`, 
    `company_name`, 
    `contact_person`, 
    `phone`, 
    `email`, 
    `discount_rate`, 
    `status`
) VALUES (
    'YT001', 
    'e10adc3949ba59abbe56e057f20f883e', 
    'YT Travel Agency', 
    'YT Manager', 
    '0412345001', 
    'yt001@htas.com.au', 
    0.55, 
    1
);

-- 2. 添加XP001中介商
INSERT INTO `agents` (
    `username`, 
    `password`, 
    `company_name`, 
    `contact_person`, 
    `phone`, 
    `email`, 
    `discount_rate`, 
    `status`
) VALUES (
    'XP001', 
    'e10adc3949ba59abbe56e057f20f883e', 
    'XP Travel Agency', 
    'XP Manager', 
    '0412345002', 
    'xp001@htas.com.au', 
    0.55, 
    1
);

-- 3. 添加CPST001中介商
INSERT INTO `agents` (
    `username`, 
    `password`, 
    `company_name`, 
    `contact_person`, 
    `phone`, 
    `email`, 
    `discount_rate`, 
    `status`
) VALUES (
    'CPST001', 
    'e10adc3949ba59abbe56e057f20f883e', 
    'CPST Travel Agency', 
    'CPST Manager', 
    '0412345003', 
    'cpst001@htas.com.au', 
    0.55, 
    1
);

-- 4. 添加peter中介商
INSERT INTO `agents` (
    `username`, 
    `password`, 
    `company_name`, 
    `contact_person`, 
    `phone`, 
    `email`, 
    `discount_rate`, 
    `status`
) VALUES (
    'peter', 
    'e10adc3949ba59abbe56e057f20f883e', 
    'Peter Travel Agency', 
    'Peter', 
    '0412345004', 
    'peter@htas.com.au', 
    0.55, 
    1
);

-- 获取新添加的中介商ID
SET @yt_agent_id = (SELECT id FROM agents WHERE username = 'YT001');
SET @xp_agent_id = (SELECT id FROM agents WHERE username = 'XP001');
SET @cpst_agent_id = (SELECT id FROM agents WHERE username = 'CPST001');
SET @peter_agent_id = (SELECT id FROM agents WHERE username = 'peter');

-- 为每个中介商添加额度信息 (使用正确的字段名)
INSERT INTO `agent_credit` (
    `agent_id`, 
    `total_credit`, 
    `used_credit`, 
    `available_credit`, 
    `last_updated`,
    `created_at`,
    `deposit_balance`,
    `credit_rating`,
    `interest_rate`,
    `billing_cycle_day`,
    `overdraft_count`,
    `is_frozen`
) VALUES 
(@yt_agent_id, 100000.00, 0.00, 100000.00, NOW(), NOW(), 0.00, 'B', 0.00, 1, 0, 0),
(@xp_agent_id, 100000.00, 0.00, 100000.00, NOW(), NOW(), 0.00, 'B', 0.00, 1, 0, 0),
(@cpst_agent_id, 100000.00, 0.00, 100000.00, NOW(), NOW(), 0.00, 'B', 0.00, 1, 0, 0),
(@peter_agent_id, 100000.00, 0.00, 100000.00, NOW(), NOW(), 0.00, 'B', 0.00, 1, 0, 0);

-- 验证查询
SELECT 
    a.id, 
    a.username, 
    a.company_name, 
    a.contact_person, 
    a.email, 
    a.phone, 
    a.discount_rate, 
    a.status,
    ac.total_credit, 
    ac.available_credit, 
    ac.used_credit,
    ac.deposit_balance,
    ac.credit_rating,
    ac.is_frozen
FROM agents a 
LEFT JOIN agent_credit ac ON a.id = ac.agent_id 
WHERE a.username IN ('YT001', 'XP001', 'CPST001', 'peter')
ORDER BY a.id; 