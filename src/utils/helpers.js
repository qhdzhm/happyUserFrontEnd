/**
 * 格式化日期字符串为易读格式
 * 支持多种日期格式，包括ISO格式和普通日期字符串
 * @param {string} dateString - 要格式化的日期字符串
 * @param {string} locale - 日期本地化格式，默认为中文 'zh-CN'
 * @returns {string} - 格式化后的日期字符串，格式为'YYYY年MM月DD日'
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // 尝试将日期字符串转换为日期对象
  let date;
  try {
    // 尝试解析不同格式的日期
    if (typeof dateString === 'string') {
      // 清理日期字符串，移除额外的空格和字符
      const cleanDateString = dateString.trim();
      
      if (cleanDateString.match(/^\d{4}-\d{2}-\d{2}(T|\s|$)/)) {
        // ISO格式日期: YYYY-MM-DD 或 YYYY-MM-DDTxx:xx:xx
        date = new Date(cleanDateString);
      } else if (cleanDateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        // 美式日期: MM/DD/YYYY
        const parts = cleanDateString.split('/');
        date = new Date(parts[2], parts[0] - 1, parts[1]);
      } else if (cleanDateString.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/)) {
        // 欧式日期: DD.MM.YYYY
        const parts = cleanDateString.split('.');
        date = new Date(parts[2], parts[1] - 1, parts[0]);
      } else {
        // 尝试直接解析
        date = new Date(cleanDateString);
      }
    } else if (dateString instanceof Date) {
      // 如果已经是Date对象，直接使用
      date = dateString;
    } else {
      return '';
    }
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('无效的日期格式:', dateString);
      return '';
    }
    
    // 使用toLocaleDateString格式化日期
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (error) {
    console.error('格式化日期出错:', error, dateString);
    return '';
  }
};

/**
 * 生成订单确认单PDF
 * @param {Object} orderData - 订单数据对象，包含itineraryData行程数据
 * @returns {Promise<Blob>} - 返回PDF文件的Blob对象
 */
export const generateOrderConfirmation = async (orderData) => {
  try {
    console.log('开始生成确认单，接收到的数据:', orderData);
    
    // 动态导入jsPDF和html2canvas
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    
    // 确保duration是有效数字
    let duration = 1;
    if (orderData.tour && typeof orderData.tour.duration === 'number' && !isNaN(orderData.tour.duration)) {
      duration = Math.max(orderData.tour.duration, 1);
    } else if (orderData.duration && typeof orderData.duration === 'number' && !isNaN(orderData.duration)) {
      duration = Math.max(orderData.duration, 1);
    }
    
    // 计算正确的开始和结束日期
    let startDate = orderData.departureDate || orderData.tour?.startDate || orderData.pickupDate;
    let endDate = orderData.returnDate || orderData.tour?.endDate;
    
    // 如果有开始日期但没有结束日期，或开始日期等于结束日期但行程超过1天
    if (startDate && (!endDate || startDate === endDate) && duration > 1) {
      try {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          // 根据行程天数计算结束日期（开始日期 + 行程天数 - 1）
          const end = new Date(start);
          end.setDate(start.getDate() + duration - 1);
          endDate = end.toISOString().split('T')[0];
        }
      } catch (e) {
        console.error('计算结束日期出错:', e);
      }
    }
    
    console.log('确认单使用的日期和行程天数:', {startDate, endDate, duration});
    
    // 处理行程信息，确保行程天数与实际数据匹配
    const itineraryData = orderData.itineraryData || {};
    
    // 如果有itinerary数据，获取天数
    const hasItineraryDays = itineraryData.itinerary && Array.isArray(itineraryData.itinerary) && itineraryData.itinerary.length > 0;
    const apiItineraryDays = hasItineraryDays ? itineraryData.itinerary.length : 0;
    console.log('API返回的行程天数:', apiItineraryDays);
    
    // 取API返回的天数和订单天数中的较大值
    const actualDuration = hasItineraryDays ? Math.max(apiItineraryDays, duration) : duration;
    console.log('最终使用的行程天数:', actualDuration);
    
    // 确保有产品名称
    const productName = orderData.tour?.name || orderData.tourName || itineraryData.title || itineraryData.name || '塔斯马尼亚旅游';
    console.log('产品名称:', productName);
    
    // 生成行程天数的HTML
    const generateItineraryDays = () => {
      let itineraryHtml = '';
      
      // 如果API返回了行程数据，使用API数据
      if (hasItineraryDays) {
        console.log('使用API返回的行程数据生成确认单');
        
        // 有详细的行程数据，按天展示
        const sortedItinerary = [...itineraryData.itinerary].sort((a, b) => 
          (a.day_number || 0) - (b.day_number || 0)
        );
        
        // 对每天的行程进行格式化显示
        sortedItinerary.forEach((day, index) => {
          const dayNumber = day.day_number || (index + 1);
          
          // 构建天数标题，例如 "第1天: 霍巴特市游-萨拉曼卡-惠灵顿山-里奇蒙小镇"
          let dayTitle = '';
          if (day.title) {
            // 如果标题已经包含"第X天"，则直接使用
            if (day.title.includes(`第${dayNumber}天`) || day.title.includes(`Day ${dayNumber}`)) {
              dayTitle = day.title;
            } else {
              dayTitle = `第${dayNumber}天: ${day.title}`;
            }
          } else {
            dayTitle = `第${dayNumber}天: ${dayNumber === 1 ? '抵达&接机' : dayNumber === actualDuration ? '送机&离开' : '行程安排'}`;
          }
          
          // 移除重复的"第X天:"前缀
          let cleanTitle = dayTitle;
          if (dayTitle.includes(`第${dayNumber}天:`)) {
            cleanTitle = dayTitle.substring(dayTitle.indexOf(':') + 1).trim();
          } else if (dayTitle.includes(`第${dayNumber}天：`)) {
            cleanTitle = dayTitle.substring(dayTitle.indexOf('：') + 1).trim();
          }
          
          itineraryHtml += `
            <div style="margin-bottom: 12px;">
              <div style="font-weight: bold; margin-bottom: 3px;">第${dayNumber}天: ${cleanTitle}</div>
          `;
          
          // 添加行程描述
          if (day.description && day.description.trim()) {
            itineraryHtml += `
              <div style="margin-left: 8px; margin-bottom: 5px; font-size: 12px;">${stripHtmlTags(day.description)}</div>
            `;
          }
          
          // 添加住宿和餐食信息
          let accommodationMeals = '';
          
          if (day.accommodation) {
            accommodationMeals += `
              <span style="margin-right: 15px;">
                <span style="color: #0066cc;">住宿:</span> ${day.accommodation}
              </span>
            `;
          }
          
          if (day.meals) {
            accommodationMeals += `
              <span>
                <span style="color: #0066cc;">用餐:</span> ${day.meals}
              </span>
            `;
          }
          
          if (accommodationMeals) {
            itineraryHtml += `
              <div style="margin-left: 8px; font-size: 12px;">${accommodationMeals}</div>
            `;
          }
          
          itineraryHtml += '</div>';
        });
      } else {
        // 没有详细行程数据，生成基本的行程天数
        console.log('没有API行程数据，使用基本行程天数生成确认单');
        for (let i = 1; i <= actualDuration; i++) {
          let dayDescription = '';
          
          if (i === 1) {
            dayDescription = '抵达&接机';
          } else if (i === actualDuration) {
            dayDescription = '送机&离开';
          } else {
            dayDescription = '行程安排';
          }
          
          itineraryHtml += `<div style="margin-bottom: 8px;">Day ${i} ${dayDescription}</div>`;
        }
        
        // 如果有整体行程描述，添加它
        if (itineraryData.description) {
          itineraryHtml += `
            <div style="margin-top: 10px; font-size: 12px; margin-left: 5px;">
              ${stripHtmlTags(itineraryData.description)}
            </div>
          `;
        }
      }
      
      // 添加行程备注
      if (itineraryData && itineraryData.note) {
        itineraryHtml += `
          <div style="margin-top: 10px; font-style: italic; font-size: 12px; color: #666;">
            ${stripHtmlTags(itineraryData.note)}
          </div>
        `;
      }
      
      return itineraryHtml;
    };
    
    // 辅助函数: 去除HTML标签，保留文本内容
    const stripHtmlTags = (html) => {
      if (!html) return '';
      // 先替换一些常见的HTML实体
      let text = html.replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");
      
      // 替换<br>标签为换行符
      text = text.replace(/<br\s*\/?>/gi, '\n');
      
      // 移除所有其他HTML标签但保留其内容
      text = text.replace(/<[^>]*>/g, '');
      
      // 清理多余的空白
      text = text.replace(/\s+/g, ' ').trim();
      
      return text;
    };

    // 创建PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // ==================== 生成第一页 - 基本信息 ====================
    const firstPage = document.createElement('div');
    firstPage.style.padding = '20px';
    firstPage.style.fontFamily = 'Arial, sans-serif';
    firstPage.style.maxWidth = '800px';
    firstPage.style.position = 'absolute';
    firstPage.style.left = '-9999px';
    
    firstPage.innerHTML = `
      <div style="margin-bottom: 30px; display: flex; align-items: center;">
        <!-- Logo放在左侧 -->
        <div style="width: 140px; margin-right: 20px;">
          <img src="/logo192.png" alt="Happy Tassie Travel" style="max-width: 100%; height: auto;" />
        </div>
        
        <!-- 标题和公司名称放在右侧 -->
        <div style="flex: 1; text-align: center;">
          <h1 style="margin: 0; color: #333; font-size: 28px; font-weight: bold;">确认函</h1>
          <div style="font-size: 16px; color: #666; margin-top: 5px;">Happy Tassie Holiday</div>
          <div style="font-size: 12px; color: #999; font-style: italic;">Your Local Experts of Tasmania</div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px; padding: 5px; background-color: #f2f2f2;">
        <h2 style="margin: 0; font-size: 16px; color: #333; padding: 3px;">预订详情</h2>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 10px 8px 0; width: 180px; color: #333;">订单号/订单号:</td>
          <td style="padding: 8px 0;">${orderData.id || orderData.orderNumber || '-'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 10px 8px 0; color: #333;">下单日期/Issue Date:</td>
          <td style="padding: 8px 0;">${formatDate(orderData.createdAt) || '-'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 10px 8px 0; color: #333;">联系人/Passenger:</td>
          <td style="padding: 8px 0;">${orderData.contact?.name || orderData.contactPerson || '-'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 10px 8px 0; color: #333;">联系方式/Contact No.:</td>
          <td style="padding: 8px 0;">${orderData.contact?.phone || orderData.contactPhone || '-'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 10px 8px 0; color: #333;">行程日期/Date:</td>
          <td style="padding: 8px 0;">
            ${formatDate(startDate) || '-'}
            ${endDate && startDate !== endDate ? 
              ` - ${formatDate(endDate)}` 
              : ''}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 10px 8px 0; color: #333;">行程路线/Itinerary:</td>
          <td style="padding: 8px 0;"><strong>${productName}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px 10px 8px 0; color: #333;">导游/Guide:</td>
          <td style="padding: 8px 0;">TBA</td>
        </tr>
      </table>
      
      <div style="margin-bottom: 20px; padding: 5px; background-color: #f2f2f2;">
        <h2 style="margin: 0; font-size: 16px; color: #333; padding: 3px;">航班/接送信息</h2>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 10px 8px 0; width: 180px; color: #333;">接团/Pick Up:</td>
          <td style="padding: 8px 0;">
            ${orderData.pickupLocation || orderData.tour?.pickupLocation || 'TBA'}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 10px 8px 0; color: #333;">送团/Drop Off:</td>
          <td style="padding: 8px 0;">TBA</td>
        </tr>
      </table>
    `;
    
    // 添加第一页到文档
    document.body.appendChild(firstPage);
    
    try {
      // 使用html2canvas渲染第一页
      const firstPageCanvas = await html2canvas(firstPage, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      // 清理第一页
      document.body.removeChild(firstPage);
      
      // 添加第一页到PDF
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (firstPageCanvas.height * pdfWidth) / firstPageCanvas.width;
      pdf.addImage(firstPageCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // ==================== 生成第二页 - 行程安排 ====================
      const secondPage = document.createElement('div');
      secondPage.style.padding = '20px';
      secondPage.style.fontFamily = 'Arial, sans-serif';
      secondPage.style.maxWidth = '800px';
      secondPage.style.position = 'absolute';
      secondPage.style.left = '-9999px';
      
      secondPage.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="width: 70px; margin-right: 10px;">
            <img src="/logo192.png" alt="Happy Tassie Travel" style="max-width: 100%; height: auto;" />
          </div>
          <div style="flex: 1;">
            <div style="font-size: 16px; font-weight: bold;">行程安排 - ${productName}</div>
            <div style="font-size: 12px; color: #666;">订单号: ${orderData.id || orderData.orderNumber || '-'}</div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px; padding: 5px; background-color: #f2f2f2;">
          <h2 style="margin: 0; font-size: 16px; color: #333; padding: 3px;">行程安排</h2>
        </div>
        
        <div style="margin-bottom: 20px; font-size: 14px;">
          ${generateItineraryDays()}
          <div style="margin-top: 10px; font-style: italic; color: #666; font-size: 12px;">*行程顺序可能有所调整，以实际发生为准</div>
        </div>
      `;
      
      // 添加第二页到文档
      document.body.appendChild(secondPage);
      
      // 添加新页面
      pdf.addPage();
      
      // 使用html2canvas渲染第二页
      const secondPageCanvas = await html2canvas(secondPage, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      // 清理第二页
      document.body.removeChild(secondPage);
      
      // 添加第二页到PDF
      const secondPageHeight = (secondPageCanvas.height * pdfWidth) / secondPageCanvas.width;
      pdf.addImage(secondPageCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, secondPageHeight);
      
      // ==================== 生成第三页 - 注意事项 ====================
      const thirdPage = document.createElement('div');
      thirdPage.style.padding = '20px';
      thirdPage.style.fontFamily = 'Arial, sans-serif';
      thirdPage.style.maxWidth = '800px';
      thirdPage.style.position = 'absolute';
      thirdPage.style.left = '-9999px';
      
      thirdPage.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="width: 70px; margin-right: 10px;">
            <img src="/logo192.png" alt="Happy Tassie Travel" style="max-width: 100%; height: auto;" />
          </div>
          <div style="flex: 1;">
            <div style="font-size: 16px; font-weight: bold;">注意事项 - ${productName}</div>
            <div style="font-size: 12px; color: #666;">订单号: ${orderData.id || orderData.orderNumber || '-'}</div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px; padding: 5px; background-color: #f2f2f2;">
          <h2 style="margin: 0; font-size: 16px; color: #333; padding: 3px;">注意事项</h2>
        </div>
        
        <div style="margin-bottom: 20px; font-size: 14px;">
          <div style="margin-bottom: 8px;"><strong>费用包含 INCLUSIONS:</strong></div>
          <div style="margin-bottom: 5px;">接送: 行程开始及离开当日机场接送及每日酒店接送 Airport transfer & CBD hotel pick up;</div>
          <div style="margin-bottom: 5px;">交通及陪同: 全程巴士交通以及专业中文导游服务 Coach transportation and professional Chinese speaking tour guide;</div>
          <div style="margin-bottom: 10px;">门票: 行程内列出门票Admission fee as indicated (薰衣草农场除外Lavender Farm Exclusion);</div>
          
          <div style="margin-bottom: 8px; margin-top: 12px;"><strong>费用不含 EXCLUSIONS:</strong></div>
          <div style="margin-bottom: 5px;">机票: 国际、国内段往返机票及税 International & Domestic airfare & Taxes;</div>
          <div style="margin-bottom: 5px;">小费: 当地导游小费 AUD$5/人/天 Tipping AUD$5/P/Day payable to the local tour guide;</div>
          <div style="margin-bottom: 5px;">膳食: 午/晚餐Lunch and Dinner</div>
          <div style="margin-bottom: 5px;">保险: 建议自行购买旅游保险 Travel Insurance(Highly Recommended)</div>
        </div>
        
        <!-- 添加页脚 -->
        <div style="border-top: 1px solid #ddd; padding-top: 10px; font-size: 12px; color: #666; text-align: center;">
          <div>Happy Tassie Travel</div>
          <div>Email: info@happytassietravel.com | Tel: +61 3 1234 5678</div>
        </div>
      `;
      
      // 添加第三页到文档
      document.body.appendChild(thirdPage);
      
      // 添加新页面
      pdf.addPage();
      
      // 使用html2canvas渲染第三页
      const thirdPageCanvas = await html2canvas(thirdPage, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      // 清理第三页
      document.body.removeChild(thirdPage);
      
      // 添加第三页到PDF
      const thirdPageHeight = (thirdPageCanvas.height * pdfWidth) / thirdPageCanvas.width;
      pdf.addImage(thirdPageCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, thirdPageHeight);
      
      console.log('确认单生成成功');
      
      // 返回PDF的Blob对象
      return pdf.output('blob');
    } catch (error) {
      // 确保临时元素被移除
      if (document.body.contains(firstPage)) {
        document.body.removeChild(firstPage);
      }
      console.error('生成PDF出错:', error);
      throw error;
    }
  } catch (error) {
    console.error('生成订单确认单PDF时出错:', error);
    throw new Error('生成订单确认单失败，请稍后再试: ' + error.message);
  }
};

/**
 * 格式化价格
 * @param {number} price - 价格
 * @param {string} currency - 货币符号，默认为 '$'
 * @returns {string} 格式化后的价格字符串
 */
export const formatPrice = (price, currency = '$') => {
  if (price === null || price === undefined) return `${currency}0`;
  
  // 确保price是数字
  const numPrice = Number(price);
  if (isNaN(numPrice)) return `${currency}0`;
  
  // 使用toLocaleString格式化价格，添加千位分隔符
  return `${currency}${numPrice.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * 截断文本
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @returns {string} 截断后的文本
 */
export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength) + '...';
};

/**
 * 生成随机ID
 * @param {number} length - ID长度，默认为 8
 * @returns {string} 随机ID
 */
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * 深拷贝对象
 * @param {Object} obj - 要拷贝的对象
 * @returns {Object} 拷贝后的对象
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (obj instanceof Object) {
    const copy = {};
    Object.keys(obj).forEach(key => {
      copy[key] = deepClone(obj[key]);
    });
    return copy;
  }
  
  return obj;
};

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间，单位为毫秒
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 限制时间，单位为毫秒
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, limit) => {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * 获取查询参数
 * @param {string} name - 参数名
 * @param {string} url - URL，默认为当前URL
 * @returns {string|null} 参数值
 */
export const getQueryParam = (name, url = window.location.href) => {
  name = name.replace(/[[\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  
  if (!results) return null;
  if (!results[2]) return '';
  
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * 滚动到页面顶部
 * @param {number} duration - 动画持续时间，单位为毫秒
 */
export const scrollToTop = (duration = 500) => {
  const scrollStep = -window.scrollY / (duration / 15);
  
  const scrollInterval = setInterval(() => {
    if (window.scrollY !== 0) {
      window.scrollBy(0, scrollStep);
    } else {
      clearInterval(scrollInterval);
    }
  }, 15);
};

/**
 * 验证邮箱
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
export const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

/**
 * 验证手机号
 * @param {string} phone - 手机号
 * @returns {boolean} 是否有效
 */
export const validatePhone = (phone) => {
  const re = /^1[3-9]\d{9}$/;
  return re.test(String(phone));
};

/**
 * 计算折扣价格（已弃用 - 请使用后端API计算折扣价格）
 * @deprecated 此方法已弃用，请使用后端API计算折扣价格
 * @param {number} originalPrice - 原价
 * @param {number|string} discountRate - 折扣率，可以是小数(0.8)或百分比(80)格式
 * @returns {number} 折扣后的价格，保留两位小数
 */
export const calculateDiscountPrice = (originalPrice, discountRate) => {
  console.warn('calculateDiscountPrice函数已弃用，请使用后端API计算折扣价格');
  
  if (!originalPrice || originalPrice <= 0) return 0;
  
  // 确保输入参数为数字
  const price = Number(originalPrice);
  let rate = Number(discountRate);
  
  // 验证参数是否有效
  if (isNaN(price) || isNaN(rate) || rate <= 0) {
    console.warn('计算折扣价格的参数无效', { originalPrice, discountRate });
    return price;
  }
  
  // 如果折扣率大于1，假设它是百分比格式(例如80)，转换为小数(0.8)
  if (rate > 1) {
    rate = rate / 100;
  }
  
  // 计算折扣价
  const discountedPrice = price * rate;
  
  // 保留两位小数
  return Math.round(discountedPrice * 100) / 100;
};

/**
 * 生成订单发票PDF
 * @param {Object} orderData - 订单数据对象
 * @returns {Promise<Blob>} - 返回PDF文件的Blob对象
 */
export const generateOrderInvoice = async (orderData) => {
  try {
    console.log('开始生成发票，接收到的数据:', orderData);
    
    // 动态导入jsPDF和html2canvas
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    
    // 计算正确的开始和结束日期
    let startDate = orderData.departureDate || orderData.tour?.startDate || orderData.pickupDate;
    let endDate = orderData.returnDate || orderData.tour?.endDate;
    
    // 确保有产品名称
    const productName = orderData.tour?.name || orderData.tourName || orderData.itineraryData?.title || orderData.itineraryData?.name || '塔斯马尼亚旅游';
    
    // 创建PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // ==================== 生成发票 ====================
    const invoicePage = document.createElement('div');
    invoicePage.style.padding = '20px';
    invoicePage.style.fontFamily = 'Arial, sans-serif';
    invoicePage.style.maxWidth = '800px';
    invoicePage.style.position = 'absolute';
    invoicePage.style.left = '-9999px';
    
    // 生成随机发票号
    const invoiceNumber = `INV-${orderData.id || orderData.orderNumber || ''}-${new Date().getTime().toString().slice(-6)}`;
    
    // 计算总价 - 产品价格已经包含GST，无需再次计算
    const totalPrice = orderData.total || orderData.totalPrice || 0;
    // 澳洲GST为10%，如果价格已含税，则：
    // 含税价格 = 不含税价格 × (1 + 0.1)
    // 不含税价格 = 含税价格 ÷ 1.1
    // GST = 含税价格 - 不含税价格
    const subtotal = totalPrice / 1.1;
    const tax = totalPrice - subtotal;
    
    // 计算支付日期 - 假设是订单创建后的第二天
    const paymentDate = new Date(orderData.createdAt);
    paymentDate.setDate(paymentDate.getDate() + 1);
    
    invoicePage.innerHTML = `
      <div style="margin-bottom: 30px; display: flex; align-items: center;">
        <!-- Logo放在左侧 -->
        <div style="width: 140px; margin-right: 20px;">
          <img src="/logo192.png" alt="Happy Tassie Travel" style="max-width: 100%; height: auto;" />
        </div>
        
        <!-- 标题和公司名称放在右侧 -->
        <div style="flex: 1; text-align: center;">
          <h1 style="margin: 0; color: #333; font-size: 28px; font-weight: bold;">发票 / INVOICE</h1>
          <div style="font-size: 16px; color: #666; margin-top: 5px;">Happy Tassie Holiday</div>
          <div style="font-size: 12px; color: #999; font-style: italic;">Your Local Experts of Tasmania</div>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <div style="font-weight: bold; margin-bottom: 5px;">供应商 / Supplier:</div>
          <div style="font-size: 14px;">Happy Tassie Travel Pty Ltd</div>
          <div style="font-size: 14px;">123 Main Street</div>
          <div style="font-size: 14px;">Hobart, TAS 7000</div>
          <div style="font-size: 14px;">Australia</div>
          <div style="font-size: 14px;">ABN: 12 345 678 901</div>
        </div>
        
        <div>
          <div style="font-weight: bold; margin-bottom: 5px;">客户 / Customer:</div>
          <div style="font-size: 14px;">${orderData.contact?.name || orderData.contactPerson || '-'}</div>
          <div style="font-size: 14px;">联系电话: ${orderData.contact?.phone || orderData.contactPhone || '-'}</div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 10px 8px 0; width: 180px; color: #333;">发票号 / Invoice #:</td>
            <td style="padding: 8px 0;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 10px 8px 0; color: #333;">发票日期 / Invoice Date:</td>
            <td style="padding: 8px 0;">${formatDate(orderData.createdAt) || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 10px 8px 0; color: #333;">支付日期 / Payment Date:</td>
            <td style="padding: 8px 0;">${formatDate(paymentDate) || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 10px 8px 0; color: #333;">订单号 / Order #:</td>
            <td style="padding: 8px 0;">${orderData.id || orderData.orderNumber || '-'}</td>
          </tr>
        </table>
      </div>
      
      <div style="margin-bottom: 20px; padding: 5px; background-color: #f2f2f2;">
        <h2 style="margin: 0; font-size: 16px; color: #333; padding: 3px;">订单详情 / Order Details</h2>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #f9f9f9;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">产品名称 / Item</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">日期 / Date</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">人数 / Qty</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">金额 / Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 12px 8px; border: 1px solid #ddd;">
              <div style="font-weight: bold;">${productName}</div>
              <div style="font-size: 12px; color: #666; margin-top: 3px;">
                塔斯马尼亚旅游 / Tasmania Tour
              </div>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
              ${formatDate(startDate) || '-'}
              ${endDate && startDate !== endDate ? 
                ` - ${formatDate(endDate)}` 
                : ''}
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
              ${(orderData.tour?.adults || 0) + (orderData.tour?.children || 0)}
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">
              ${formatPrice(subtotal)}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
              小计 / Subtotal:
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">
              ${formatPrice(subtotal)}
            </td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
              GST (10%):
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">
              ${formatPrice(tax)}
            </td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td colspan="3" style="padding: 12px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
              总计 / Total:
            </td>
            <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
              ${formatPrice(totalPrice)}
            </td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 12px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
              已付款 / Paid:
            </td>
            <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
              ${formatPrice(totalPrice)}
            </td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 12px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
              余额 / Balance Due:
            </td>
            <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
              ${formatPrice(0)}
            </td>
          </tr>
        </tfoot>
      </table>
      
      <div style="margin-bottom: 20px; font-size: 14px;">
        <div style="margin-bottom: 10px;"><strong>支付信息 / Payment Information:</strong></div>
        <div>支付方式 / Payment Method: 在线支付 / Online Payment</div>
        <div>支付状态 / Payment Status: 已支付 / Paid</div>
      </div>
      
      <div style="margin-bottom: 30px; font-size: 14px;">
        <div style="margin-bottom: 10px;"><strong>备注 / Notes:</strong></div>
        <div>此发票已支付，感谢您选择Happy Tassie Travel。</div>
        <div>This invoice has been paid. Thank you for choosing Happy Tassie Travel.</div>
      </div>
      
      <!-- 添加页脚 -->
      <div style="border-top: 1px solid #ddd; padding-top: 10px; font-size: 12px; color: #666; text-align: center;">
        <div>Happy Tassie Travel</div>
        <div>Email: info@happytassietravel.com | Tel: +61 3 1234 5678</div>
        <div>ABN: 12 345 678 901</div>
      </div>
    `;
    
    // 添加页面到文档
    document.body.appendChild(invoicePage);
    
    try {
      // 使用html2canvas渲染页面
      const invoiceCanvas = await html2canvas(invoicePage, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      // 清理页面
      document.body.removeChild(invoicePage);
      
      // 添加页面到PDF
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (invoiceCanvas.height * pdfWidth) / invoiceCanvas.width;
      pdf.addImage(invoiceCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      console.log('发票生成成功');
      
      // 返回PDF的Blob对象
      return pdf.output('blob');
    } catch (error) {
      // 确保临时元素被移除
      if (document.body.contains(invoicePage)) {
        document.body.removeChild(invoicePage);
      }
      console.error('生成PDF出错:', error);
      throw error;
    }
  } catch (error) {
    console.error('生成订单发票PDF时出错:', error);
    throw new Error('生成订单发票失败，请稍后再试: ' + error.message);
  }
}; 