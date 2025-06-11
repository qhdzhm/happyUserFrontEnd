/**
 * 文本解析工具 - 用于从自由文本中提取结构化的预订信息
 */

/**
 * 检查是否为常见的英文词汇（非姓名）
 */
const isCommonEnglishWord = (word) => {
  const commonWords = ['Order', 'Booking', 'Hotel', 'Flight', 'Date', 'Time', 'Service', 
                      'Tour', 'Travel', 'Guest', 'Customer', 'Phone', 'Contact', 'Email',
                      'Check', 'Room', 'Night', 'Day', 'Adult', 'Child', 'Person', 'Group',
                      'Info', 'Information', 'Number', 'Code'];
  
  return commonWords.some(common => word.toLowerCase() === common.toLowerCase());
};

/**
 * 从文本中提取预订信息
 * @param {string} text - 中介提供的预订文本
 * @returns {Object} - 提取的预订信息对象
 */
export const extractBookingInfo = (text) => {
  if (!text || typeof text !== 'string') {
    return {};
  }

  const result = {
    tourName: '',            // 服务类型/团名
    tourStartDate: '',       // 出发日期
    tourEndDate: '',         // 结束日期
    flightNumber: '',        // 到达航班
    returnFlightNumber: '',  // 返程航班
    departureTime: '',       // 出发时间
    pickupLocation: '',      // 接客地点
    dropoffLocation: '',     // 送客地点
    serviceType: '',         // 服务类型
    groupSize: 0,            // 团队人数
    adultCount: 0,           // 成人数量
    childCount: 0,           // 儿童数量
    luggageCount: 0,         // 行李数量
    passengers: [],          // 乘客信息
    roomType: '',            // 房型
    hotelLevel: '',          // 酒店级别
    specialRequests: '',     // 特殊要求
    hotelCheckInDate: '',    // 酒店入住日期
    hotelCheckOutDate: '',   // 酒店退房日期
    pickupDate: '',          // 接送日期
    dropoffDate: '',         // 接送日期
    hotelRoomCount: 0,        // 酒店房间数量
  };

  // 提取服务类型/团名
  const tourNameMatch = text.match(/服务类型[：:]\s*(.+?)(?:\r?\n|$)/);
  if (tourNameMatch) {
    result.tourName = tourNameMatch[1].trim();
    // 设置服务类型为"跟团游"，如果文本中包含"跟团"
    if (result.tourName.includes('跟团') || text.includes('跟团')) {
      result.serviceType = '跟团游';
    } else if (result.tourName.includes('日游') || text.includes('日游')) {
      result.serviceType = '日游';
    }
  }

  // 提取参团日期
  const dateMatch = text.match(/参团日期(?:（.*?）)?[：:]\s*(.+?)(?:\r?\n|$)/);
  if (dateMatch) {
    let dateStr = dateMatch[1].trim();
    // 处理常见的日期格式
    if (dateStr.match(/\d+月\d+日/)) {
      // 转换中文日期格式为标准格式
      const yearMatch = dateStr.match(/(\d{4})年/) || [null, new Date().getFullYear()];
      const monthMatch = dateStr.match(/(\d+)月/);
      const dayMatch = dateStr.match(/(\d+)日/);
      
      if (monthMatch && dayMatch) {
        const year = yearMatch[1];
        const month = monthMatch[1].padStart(2, '0');
        const day = dayMatch[1].padStart(2, '0');
        result.tourStartDate = `${year}-${month}-${day}`;
        
        // 尝试根据团名估算行程天数并计算结束日期
        const durationMatch = result.tourName.match(/(\d+)日/) || result.tourName.match(/(\d+)天/);
        if (durationMatch) {
          const duration = parseInt(durationMatch[1], 10);
          const endDate = new Date(result.tourStartDate);
          endDate.setDate(endDate.getDate() + duration - 1);
          result.tourEndDate = endDate.toISOString().split('T')[0];
          
          // 设置默认的接车、酒店入住、退房和送回日期
          result.pickupDate = result.tourStartDate;
          result.dropoffDate = result.tourEndDate;
          result.hotelCheckInDate = result.tourStartDate;
          result.hotelCheckOutDate = result.tourEndDate;
        }
      }
    } else if (dateStr.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
      // 处理日/月/年格式
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        let year = parts[2];
        if (year.length === 2) year = `20${year}`;
        const month = parts[1].padStart(2, '0');
        const day = parts[0].padStart(2, '0');
        result.tourStartDate = `${year}-${month}-${day}`;
        
        // 尝试根据团名估算行程天数并计算结束日期
        const durationMatch = result.tourName.match(/(\d+)日/) || result.tourName.match(/(\d+)天/);
        if (durationMatch) {
          const duration = parseInt(durationMatch[1], 10);
          const endDate = new Date(result.tourStartDate);
          endDate.setDate(endDate.getDate() + duration - 1);
          result.tourEndDate = endDate.toISOString().split('T')[0];
          
          // 设置默认的接车、酒店入住、退房和送回日期
          result.pickupDate = result.tourStartDate;
          result.dropoffDate = result.tourEndDate;
          result.hotelCheckInDate = result.tourStartDate;
          result.hotelCheckOutDate = result.tourEndDate;
        }
      }
    } else if (dateStr.match(/\d{4}-\d{1,2}-\d{1,2}/)) {
      // 已经是标准格式
      result.tourStartDate = dateStr;
      
      // 尝试根据团名估算行程天数并计算结束日期
      const durationMatch = result.tourName.match(/(\d+)日/) || result.tourName.match(/(\d+)天/);
      if (durationMatch) {
        const duration = parseInt(durationMatch[1], 10);
        const endDate = new Date(result.tourStartDate);
        endDate.setDate(endDate.getDate() + duration - 1);
        result.tourEndDate = endDate.toISOString().split('T')[0];
        
        // 设置默认的接车、酒店入住、退房和送回日期
        result.pickupDate = result.tourStartDate;
        result.dropoffDate = result.tourEndDate;
        result.hotelCheckInDate = result.tourStartDate;
        result.hotelCheckOutDate = result.tourEndDate;
      }
    }
  }

  // 提取航班信息
  const arrivalFlightMatch = text.match(/(?:到达|抵达|到港|航班(?:到达)?|航班到达)[：:]*\s*([A-Z]{2}\d+|[A-Z]{1}\d+|[A-Z]{3}\d+)/i);
  if (arrivalFlightMatch) {
    result.flightNumber = arrivalFlightMatch[1].toUpperCase();
  }

  const returnFlightMatch = text.match(/(?:返程|回程|返航|回程航班)[：:]*\s*([A-Z]{2}\d+|[A-Z]{1}\d+|[A-Z]{3}\d+)/i);
  if (returnFlightMatch) {
    result.returnFlightNumber = returnFlightMatch[1].toUpperCase();
  }

  // 提取出发时间
  const departureTimeMatch = text.match(/出发时间[：:]\s*(.+?)(?:\r?\n|$)/);
  if (departureTimeMatch) {
    result.departureTime = departureTimeMatch[1].trim();
  }

  // 提取接送地点
  const pickupLocationMatch = text.match(/(?:出发地点|接客地点|接机地点)[：:]\s*(.+?)(?:\r?\n|$)/);
  if (pickupLocationMatch) {
    result.pickupLocation = pickupLocationMatch[1].trim();
  }
  // 如果没有明确指定，但提到了机场，则假设为机场接送
  if (!result.pickupLocation && text.includes('机场')) {
    result.pickupLocation = text.match(/(.{2,10}机场)/)?.[1] || '霍巴特机场';
  }
  
  // 默认送客地点与接客地点相同
  result.dropoffLocation = result.pickupLocation;

  // 提取人数信息
  const groupSizeMatch = text.match(/(?:跟团人数|团队人数|人数)[：:]\s*(\d+)(?:\D|$)/);
  if (groupSizeMatch) {
    result.groupSize = parseInt(groupSizeMatch[1], 10);
    // 默认成人数量等于团队人数
    result.adultCount = result.groupSize;
  }
  
  // 如果文本明确提到儿童，则调整成人数量
  const childMatch = text.match(/儿童[：:]*\s*(\d+)/);
  if (childMatch) {
    result.childCount = parseInt(childMatch[1], 10);
    result.adultCount = result.groupSize - result.childCount;
  }

  // 提取行李数量
  const luggageMatch = text.match(/(?:行李数|行李数量)[：:]\s*(\d+)(?:\D|$)/);
  if (luggageMatch) {
    result.luggageCount = parseInt(luggageMatch[1], 10);
  }

  // 提取房型信息
  const roomTypeMatch = text.match(/(?:房型|房间类型)[：:]\s*(.+?)(?:\r?\n|$)/);
  if (roomTypeMatch) {
    const roomTypeText = roomTypeMatch[1].trim().toLowerCase();
    if (roomTypeText.includes('双') || roomTypeText.includes('两') || roomTypeText.includes('2')) {
      result.roomType = roomTypeText.includes('床') ? '标准双人间' : '双人间';
    } else if (roomTypeText.includes('单') || roomTypeText.includes('1')) {
      result.roomType = '单人间';
    } else if (roomTypeText.includes('三') || roomTypeText.includes('3')) {
      result.roomType = '三人间';
    } else {
      result.roomType = roomTypeText;
    }
  } else {
    // 默认双床房
    result.roomType = '双人间';
  }
  
  // 房间数量 - 默认为1间
  result.hotelRoomCount = 1;

  // 检查文本中是否特别提到需要2间房
  const roomCountMatch = text.match(/(?:房间|房)(?:数量|数)?[：:]\s*(\d+)(?:\D|$)/) || 
                        text.match(/(\d+)(?:间|个)(?:房|房间)/) ||
                        text.match(/需要(\d+)(?:间|个)(?:房|房间)/);
  if (roomCountMatch) {
    result.hotelRoomCount = parseInt(roomCountMatch[1], 10);
  }

  // 提取酒店级别
  const hotelLevelMatch = text.match(/(?:酒店级别|酒店等级)[：:]\s*(.+?)(?:\r?\n|$)/);
  if (hotelLevelMatch) {
    const levelText = hotelLevelMatch[1].trim();
    // 检查是否包含星级数字
    const starMatch = levelText.match(/(\d+(?:\.\d+)?)(?:星级?)?/);
    if (starMatch) {
      result.hotelLevel = `${starMatch[1]}星`;
    } else {
      result.hotelLevel = levelText;
    }
  }

  // 提取乘客信息
  // 这部分比较复杂，我们尝试识别常见的模式
  const passengerSection = text.match(/(?:乘客信息|游客信息)[：:]([\s\S]*?)(?:房型|酒店级别|行程安排|备注|$)/i);
  
  if (passengerSection) {
    const passengerText = passengerSection[1].trim();
    // 分割每个乘客信息行
    const passengerLines = passengerText.split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // 提取每个乘客的信息
    for (const line of passengerLines) {
      const passenger = {
        fullName: '',
        phone: '',
        wechat: '',
        passportNumber: '',
        isChild: false,
        childAge: null
      };
      
      // 改进的姓名提取逻辑，支持中文和英文拼音姓名
      let nameMatch = null;
      
      // 先尝试提取英文全名（Firstname Lastname）
      const englishNameMatch = line.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/);
      if (englishNameMatch) {
        nameMatch = englishNameMatch;
        passenger.fullName = nameMatch[0].trim();
      } else {
        // 再尝试提取中文姓名（排除数字、电话号码和护照号）
        const chineseNameMatch = line.match(/^([^\d\s()（）]+?)(?:\s|[EG]\d|[A-Z]{2}\d|\d{3,}|$)/);
        if (chineseNameMatch) {
          let possibleName = chineseNameMatch[1].trim();
          // 过滤掉明显不是姓名的内容
          if (!possibleName.match(/[：:]/)) {
            nameMatch = chineseNameMatch;
            passenger.fullName = possibleName;
          }
        }
      }
      
      // 如果仍然没有找到姓名，尝试单个英文单词（可能是单名）
      if (!passenger.fullName) {
        const singleEnglishMatch = line.match(/\b[A-Z][a-z]{2,15}\b/);
        if (singleEnglishMatch && !isCommonEnglishWord(singleEnglishMatch[0])) {
          passenger.fullName = singleEnglishMatch[0];
        }
      }
      
      // 检查是否为儿童
      if (passenger.fullName && (passenger.fullName.includes('儿童') || passenger.fullName.toLowerCase().includes('child'))) {
        passenger.isChild = true;
        
        // 尝试提取儿童年龄
        const ageMatch = line.match(/(\d+)(?:岁|age|years?|Age)/i);
        if (ageMatch) {
          passenger.childAge = ageMatch[1];
          // 清理名字中的年龄标记
          passenger.fullName = passenger.fullName.replace(/\d+岁?/, '').replace(/\d+\s*(?:age|years?)/i, '').trim();
        }
      }
      
      // 提取电话号码（支持多种格式）
      const phoneMatch = line.match(/(?:\+?86)?(?:1[3-9]\d{9}|\d{3,4}[-\s]?\d{3,4}[-\s]?\d{3,4})/);
      if (phoneMatch) {
        passenger.phone = phoneMatch[0].replace(/[-\s]/g, '');
      }
      
      // 提取护照号（支持中国护照和其他格式）
      const passportMatch = line.match(/[A-Z]\d{8}|[A-Z]{2}\d{7}/);
      if (passportMatch) {
        passenger.passportNumber = passportMatch[0];
      }
      
      if (passenger.fullName) {
        result.passengers.push(passenger);
      }
    }
  }
  
  // 尝试单独提取电话和微信
  const chinaPhoneMatch = text.match(/国内电话[：:]\s*([0-9\s\-+]+)/);
  const ausPhoneMatch = text.match(/澳洲电话[：:]\s*([0-9\s\-+]+)/);
  const wechatMatch = text.match(/微信[：:]\s*([^\n]+)/);
  
  // 如果找到了电话号码，将其应用到第一个乘客
  if (result.passengers.length > 0) {
    // 优先使用澳洲电话，其次是中国电话
    if (ausPhoneMatch && ausPhoneMatch[1]) {
      result.passengers[0].phone = ausPhoneMatch[1].trim();
    } else if (chinaPhoneMatch && chinaPhoneMatch[1]) {
      result.passengers[0].phone = chinaPhoneMatch[1].trim();
    }
    
    if (wechatMatch && wechatMatch[1]) {
      result.passengers[0].wechat = wechatMatch[1].trim();
    }
  }
  
  // 如果没有成功提取到乘客信息但有团队人数，创建占位乘客
  if (result.passengers.length === 0 && result.groupSize > 0) {
    for (let i = 0; i < result.groupSize; i++) {
      result.passengers.push({
        fullName: `乘客${i+1}`,
        phone: '',
        wechat: '',
        isChild: false,
        childAge: null
      });
    }
  }
  
  // 尝试匹配姓名
  const nameMatches = text.matchAll(/姓名[：:]\s*([^\n]+)/g);
  const names = Array.from(nameMatches).map(match => match[1]?.trim()).filter(Boolean);
  
  // 如果找到的姓名多于已有乘客，创建新乘客
  if (names.length > result.passengers.length) {
    for (let i = result.passengers.length; i < names.length; i++) {
      result.passengers.push({
        fullName: names[i],
        phone: '',
        wechat: '',
        isChild: false,
        childAge: null
      });
    }
  } else if (names.length > 0 && names.length <= result.passengers.length) {
    // 更新已有乘客的姓名
    names.forEach((name, idx) => {
      if (idx < result.passengers.length) {
        result.passengers[idx].fullName = name;
      }
    });
  }

  // ===== 增强版备注提取逻辑 =====
  
  // 更可靠的备注提取方法：查找"备注"关键词并提取剩余全部内容
  let hasFoundRemark = false;
  
  // 第一种情况：查找"备注："或"备注:"格式的行
  const lines = text.split(/\r?\n/);
  let remarkContent = [];
  let isInRemarkSection = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 检查是否找到备注标记
    if (!isInRemarkSection && (trimmedLine.match(/^备\s*注\s*[:：]/) || trimmedLine.match(/^备\s*注\s*$/))) {
      isInRemarkSection = true;
      // 如果"备注:"后面在同一行有内容，提取它
      const afterColon = trimmedLine.replace(/^备\s*注\s*[:：]/, '').trim();
      if (afterColon) {
        remarkContent.push(afterColon);
      }
      continue;
    }
    
    // 已经进入备注区域，继续收集所有后续行
    if (isInRemarkSection) {
      remarkContent.push(trimmedLine);
    }
  }
  
  // 如果找到了备注内容
  if (remarkContent.length > 0) {
    result.specialRequests = remarkContent.join('\n');
    hasFoundRemark = true;
  }
  
  // 第二种情况：如果上面的方法没找到，尝试使用正则表达式匹配从"备注"开始到文本结束的所有内容
  if (!hasFoundRemark) {
    const remarkRegex = /(备\s*注\s*[:：]?)([\s\S]*)/i;
    const match = text.match(remarkRegex);
    if (match && match[2]) {
      result.specialRequests = match[2].trim();
      hasFoundRemark = true;
    }
  }
  
  // 第三种情况：查找其他可能的备注关键词
  if (!hasFoundRemark) {
    const otherRemarkKeywords = ['特殊要求', '注意事项', '特别说明', '备注事项', '注意', '其他信息', '需求', '要求'];
    for (const keyword of otherRemarkKeywords) {
      const keywordRegex = new RegExp(`(${keyword}\\s*[:：]?)([\\\s\\\S]*)`, 'i');
      const match = text.match(keywordRegex);
      if (match && match[2]) {
        result.specialRequests = match[2].trim();
        hasFoundRemark = true;
        break;
      }
    }
  }
  
  // 如果仍然没有找到备注信息，尝试提取文本末尾的内容作为备注
  if (!hasFoundRemark) {
    // 将文本按空行分段
    const textSections = text.split(/\r?\n\r?\n/);
    if (textSections.length > 0) {
      const lastSection = textSections[textSections.length - 1].trim();
      if (lastSection && 
          !lastSection.match(/^服务类型/) && 
          !lastSection.match(/^参团日期/) &&
          !lastSection.match(/^乘客信息/) &&
          !lastSection.match(/^房型/) &&
          !lastSection.match(/^酒店级别/)) {
        result.specialRequests = lastSection;
      }
    }
  }
  
  // 确保特殊要求不为空
  if (!result.specialRequests) {
    // 尝试查找任何孤立的、看起来像备注的行
    const possibleRemarks = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed && 
             !trimmed.match(/^服务类型|^参团日期|^乘客信息|^房型|^酒店级别|^\d{4}[-\/]|^[A-Z]{2}\d+/) &&
             trimmed.length > 5;
    });
    
    if (possibleRemarks.length > 0) {
      result.specialRequests = possibleRemarks.join('\n');
    }
  }

  // 后处理：根据数据合理性进行调整
  
  // 1. 如果没有明确提取到服务类型，但提到了"跟团"，则设置为"跟团游"
  if (!result.serviceType && text.includes('跟团')) {
    result.serviceType = '跟团游';
  } else if (!result.serviceType) {
    // 默认为"跟团游"
    result.serviceType = '跟团游';
  }
  
  // 2. 如果没有提取到成人/儿童数量但有总人数，则默认全为成人
  if (result.groupSize > 0 && result.adultCount === 0 && result.childCount === 0) {
    result.adultCount = result.groupSize;
  }
  
  // 3. 尝试根据团名推断天数，如果结束日期没有被设置
  if (result.tourStartDate && !result.tourEndDate) {
    // 先尝试从团名中提取
    let durationMatch = result.tourName.match(/(\d+)日/) || result.tourName.match(/(\d+)天/) || result.tourName.match(/(\d+)日游/);
    
    // 如果团名中没有找到，从整个文本尝试匹配行程天数相关的信息
    if (!durationMatch) {
      durationMatch = text.match(/(\d+)(?:日|天)(?:游|跟团)/);
    }
    
    // 如果找到"行程安排"部分，尝试计算总天数
    if (!durationMatch && text.includes('行程安排')) {
      const dayCount = (text.match(/第\d+天/g) || []).length;
      if (dayCount > 0) {
        durationMatch = [null, dayCount.toString()];
      }
    }
    
    if (durationMatch) {
      const duration = parseInt(durationMatch[1], 10);
      
      const endDate = new Date(result.tourStartDate);
      endDate.setDate(endDate.getDate() + duration - 1);
      result.tourEndDate = endDate.toISOString().split('T')[0];
      
      // 设置默认的接车、酒店入住、退房和送回日期
      result.pickupDate = result.tourStartDate;
      result.dropoffDate = result.tourEndDate;
      result.hotelCheckInDate = result.tourStartDate;
      result.hotelCheckOutDate = result.tourEndDate;
    }
  }
  
  // 4. 护照信息处理不再需要 - 根据用户要求
  
  // 5. 确保房间类型和数量有默认值
  if (!result.roomType) {
    result.roomType = '双人间';
  }
  
  // 根据文本中提取的房间数量，如果没有则默认为1间
  if (!result.hotelRoomCount || result.hotelRoomCount <= 0) {
    result.hotelRoomCount = 1;
  }
  
  // 6. 确保所有关键日期都有默认值
  if (result.tourStartDate && !result.pickupDate) {
    result.pickupDate = result.tourStartDate;
  }
  
  if (result.tourEndDate && !result.dropoffDate) {
    result.dropoffDate = result.tourEndDate;
  }
  
  if (result.tourStartDate && !result.hotelCheckInDate) {
    result.hotelCheckInDate = result.tourStartDate;
  }
  
  if (result.tourEndDate && !result.hotelCheckOutDate) {
    result.hotelCheckOutDate = result.tourEndDate;
  }

  return result;
};

export default {
  extractBookingInfo
}; 