class YouTubeScraperService {
  // Buscar canal por nome ou handle
  async searchChannel(query) {
    try {
      // Normalizar query
      const cleanQuery = query.startsWith('@') ? query.substring(1) : query
      // URLs para tentar - priorizar live URL para handles
      const urlsToTry = query.startsWith('@')
        ? [
            `https://www.youtube.com/@${cleanQuery}/live`, // Priorizar live URL para handles
            `https://www.youtube.com/@${cleanQuery}`,
            `https://www.youtube.com/c/${cleanQuery}/live`,
            `https://www.youtube.com/c/${cleanQuery}`,
            `https://www.youtube.com/user/${cleanQuery}/live`,
            `https://www.youtube.com/user/${cleanQuery}`,
            `https://www.youtube.com/channel/${cleanQuery}` // Caso já seja um ID
          ]
        : [
            `https://www.youtube.com/@${cleanQuery}`,
            `https://www.youtube.com/c/${cleanQuery}`,
            `https://www.youtube.com/user/${cleanQuery}`,
            `https://www.youtube.com/channel/${cleanQuery}` // Caso já seja um ID
          ]
      for (const url of urlsToTry) {
        try {
          console.log('🌐 Tentando URL:', url)
          const result = await this.fetchPage(url)
          if (result.success && result.data) {
            const channel = this.parseChannelFromHTML(result.data, url)
            if (channel) {
              // Se é uma live URL e encontrou canal, verificar se está ao vivo
              if (url.includes('/live') && !channel.isLive) {
                // Forçar detecção de live para URLs /live
                const liveInfo = await this.getLiveChatInfo(channel.id)
                if (liveInfo) {
                  channel.isLive = true
                  channel.liveVideoId = liveInfo.videoId
                  channel.liveChatId = liveInfo.chatId
                }
              }
              return channel
            }
          }
        } catch (error) {
          console.log('❌ Erro na URL:', url, error)
          continue
        }
      }
      // Se não encontrou, tentar busca direta por live
      return await this.searchChannelByLive(cleanQuery)
    } catch (error) {
      console.error('Erro ao buscar canal via scraping:', error)
      return null
    }
  }
  // Buscar canal diretamente pela live
  async searchChannelByLive(query) {
    try {
      const liveUrls = [
        `https://www.youtube.com/@${query}/live`,
        `https://www.youtube.com/c/${query}/live`,
        `https://www.youtube.com/user/${query}/live`
      ]
      for (const url of liveUrls) {
        try {
          console.log('🌐 Tentando live URL:', url)
          const result = await this.fetchPage(url)
          if (result.success && result.data) {
            const channel = this.parseChannelFromHTML(result.data, url)
            if (channel && channel.isLive) {
              return channel
            }
          }
        } catch (error) {
          console.log('❌ Erro na live URL:', url, error)
          continue
        }
      }
      return null
    } catch (error) {
      console.error('Erro ao buscar canal por live:', error)
      return null
    }
  }
  // Verificar se canal está ao vivo e obter chat ID
  async getLiveChatInfo(channelId) {
    try {
      console.log('🔍 Verificando live do canal:', channelId)
      // Tentar múltiplas URLs para encontrar a live
      const urlsToTry = [
        `https://www.youtube.com/channel/${channelId}/live`,
        `https://www.youtube.com/channel/${channelId}`,
        `https://www.youtube.com/@${channelId}/live`,
        `https://www.youtube.com/@${channelId}`
      ]
      for (const url of urlsToTry) {
        try {
          console.log('🌐 Tentando URL:', url)
          const result = await this.fetchPage(url)
          if (!result.success || !result.data) {
            continue
          }
          const html = result.data
          // Verificar se está ao vivo com múltiplos padrões
          const isLivePatterns = [
            /"isLiveContent":true/,
            /"liveBroadcastContent":"live"/,
            /"isLive":true/,
            /"liveStreamingDetails"/,
            /"concurrentViewers"/
          ]
          const isLive = isLivePatterns.some((pattern) => pattern.test(html))
          if (!isLive) {
            console.log('❌ Não está ao vivo nesta URL:', url)
            continue
          }
          // Procurar por vídeo ao vivo com múltiplos padrões
          const videoIdPatterns = [
            /"videoId":"([^"]+)"/,
            /"watch\?v=([^"]+)"/,
            /"embed\/([^"]+)"/,
            /"live_chat\?continuation=([^"]+)"/
          ]
          let videoId = null
          for (const pattern of videoIdPatterns) {
            const match = pattern.exec(html)
            if (match && match[1] && match[1].length > 10) {
              videoId = match[1]
              break
            }
          }
          if (!videoId) {
            console.log('❌ Video ID não encontrado em:', url)
            continue
          }
          // Buscar chat ID do vídeo
          const chatId = await this.getChatIdFromVideo(videoId)
          if (chatId) {
            return { videoId, chatId }
          }
          // Tentar extrair chat ID diretamente do HTML
          const chatIdPatterns = [
            /"liveChatContinuation":"([^"]+)"/,
            /"continuation":"([^"]+)"/,
            /"liveChatId":"([^"]+)"/
          ]
          for (const pattern of chatIdPatterns) {
            const match = pattern.exec(html)
            if (match && match[1]) {
              return { videoId, chatId: match[1] }
            }
          }
        } catch (error) {
          console.log('❌ Erro na URL:', url, error)
          continue
        }
      }
      console.log('❌ Nenhuma live encontrada em nenhuma URL')
      return null
    } catch (error) {
      console.error('Erro ao verificar live:', error)
      return null
    }
  }
  // Obter chat ID de um vídeo específico
  async getChatIdFromVideo(videoId) {
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
      const result = await this.fetchPage(videoUrl)
      if (!result.success || !result.data) {
        return null
      }
      const html = result.data
      // Procurar por continuation token ou live chat ID
      const patterns = [
        /"continuation":"([^"]+)"/,
        /"liveChatContinuation":"([^"]+)"/,
        /"liveChatId":"([^"]+)"/
      ]
      for (const pattern of patterns) {
        const match = pattern.exec(html)
        if (match && match[1]) {
          return match[1]
        }
      }
      return null
    } catch (error) {
      console.error('Erro ao obter chat ID:', error)
      return null
    }
  }
  // Capturar mensagens do chat via scraping
  async getLiveChatMessages(chatId) {
    try {
      // Usar a API interna do YouTube (mesmo método que o navegador usa)
      const apiUrl = 'https://www.youtube.com/youtubei/v1/live_chat/get_live_chat'
      const payload = {
        context: {
          client: {
            hl: 'pt',
            gl: 'BR',
            clientName: 'WEB',
            clientVersion: '2.20250101.00.00',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            originalUrl: `https://www.youtube.com/live_chat?continuation=${chatId}`
          }
        },
        continuation: chatId
      }
      const result = await this.fetchPage(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      if (!result.success || !result.data) {
        console.log('❌ Falha ao obter dados da API')
        return []
      }
      const data = typeof result.data === 'string' ? JSON.parse(result.data) : result.data
      const messages = this.parseChatMessages(data)
      // Se não encontrou mensagens, tentar método alternativo
      if (messages.length === 0) {
        console.log('🔄 Nenhuma mensagem encontrada, tentando método alternativo...')
        return await this.getLiveChatMessagesAlternative(chatId)
      }
      return messages
    } catch (error) {
      console.error('Erro ao capturar mensagens:', error)
      // Tentar método alternativo em caso de erro
      return await this.getLiveChatMessagesAlternative(chatId)
    }
  }
  // Método alternativo para capturar mensagens
  async getLiveChatMessagesAlternative(chatId) {
    try {
      // Tentar acessar diretamente a página de live chat
      const liveChatUrl = `https://www.youtube.com/live_chat?continuation=${chatId}`
      const result = await this.fetchPage(liveChatUrl)
      if (!result.success || !result.data) {
        return []
      }
      const html = result.data
      // Procurar por mensagens no HTML
      const messagePattern =
        /"liveChatTextMessageRenderer":\s*\{[^}]+"message":\s*\{[^}]+"simpleText":"([^"]+)"[^}]*\}[^}]*"authorName":\s*\{[^}]+"simpleText":"([^"]+)"[^}]*\}/g
      const messages = []
      let match
      while ((match = messagePattern.exec(html)) !== null) {
        const messageText = match[1]
        const authorName = match[2]
        if (messageText && authorName) {
          messages.push({
            id: `alt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            author: {
              name: authorName,
              color: this.generateUserColor(authorName)
            },
            message: {
              text: messageText
            },
            timestamp: Date.now()
          })
        }
      }
      return messages
    } catch (error) {
      console.error('Erro no método alternativo:', error)
      return []
    }
  }
  // Fazer requisição para página
  async fetchPage(url, options = {}) {
    try {
      // Usar a função do Electron para fazer requisições
      const body = typeof options.body === 'string' ? options.body : undefined
      const result = await window.api.fetchYouTube(url, body)
      return result
    } catch (error) {
      console.error('Erro ao fazer requisição:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }
  // Parsear canal do HTML
  parseChannelFromHTML(html, url) {
    try {
      // Extrair informações do canal
      const titlePattern = /"title":"([^"]+)"/
      const channelIdPattern = /"channelId":"([^"]+)"/
      const customUrlPattern = /"customUrl":"([^"]+)"/
      const titleMatch = titlePattern.exec(html)
      const channelIdMatch = channelIdPattern.exec(html)
      const customUrlMatch = customUrlPattern.exec(html)
      if (!titleMatch || !channelIdMatch) {
        return null
      }
      const title = titleMatch[1]
      const channelId = channelIdMatch[1]
      const customUrl = customUrlMatch?.[1]
      // Verificar se está ao vivo com múltiplos padrões
      const isLivePatterns = [
        /"isLiveContent":true/,
        /"liveBroadcastContent":"live"/,
        /"isLive":true/,
        /"liveStreamingDetails"/,
        /"concurrentViewers"/,
        /"LIVE NOW"/,
        /"AO VIVO"/,
        /"live_chat"/, // Padrão específico para URLs /live
        /"continuation"/, // Token de continuação do chat
        /"liveChatRenderer"/, // Renderer do chat ao vivo
        /"isLiveStream":true/ // Outro padrão de live
      ]
      const isLive = isLivePatterns.some((pattern) => pattern.test(html))
      // Se a URL contém /live, assumir que está ao vivo mesmo sem padrões específicos
      const isLiveUrl = url.includes('/live')
      const finalIsLive = isLive || isLiveUrl
      // Procurar por vídeo ao vivo
      let liveVideoId
      let liveChatId
      if (finalIsLive) {
        // Múltiplos padrões para video ID
        const videoIdPatterns = [/"videoId":"([^"]+)"/, /"watch\?v=([^"]+)"/, /"embed\/([^"]+)"/]
        for (const pattern of videoIdPatterns) {
          const match = pattern.exec(html)
          if (match && match[1] && match[1].length > 10) {
            liveVideoId = match[1]
            break
          }
        }
        // Múltiplos padrões para chat ID
        const chatIdPatterns = [
          /"liveChatContinuation":"([^"]+)"/,
          /"continuation":"([^"]+)"/,
          /"liveChatId":"([^"]+)"/
        ]
        for (const pattern of chatIdPatterns) {
          const match = pattern.exec(html)
          if (match && match[1]) {
            liveChatId = match[1]
            break
          }
        }
      }
      return {
        id: channelId,
        title,
        customUrl,
        isLive: finalIsLive,
        liveVideoId,
        liveChatId
      }
    } catch (error) {
      console.error('Erro ao parsear canal:', error)
      return null
    }
  }
  // Parsear mensagens do chat
  parseChatMessages(data) {
    const messages = []
    try {
      // Múltiplos caminhos para encontrar mensagens
      const messagePaths = [
        data.continuationContents?.liveChatContinuation?.actions,
        data.contents?.liveChatContinuation?.actions,
        data.liveChatContinuation?.actions,
        data.actions
      ]
      for (const actions of messagePaths) {
        if (actions && Array.isArray(actions)) {
          for (const action of actions) {
            // Diferentes tipos de renderers de mensagem
            const messageRenderers = [
              action.addChatItemAction?.item?.liveChatTextMessageRenderer,
              action.addChatItemAction?.item?.liveChatPaidMessageRenderer,
              action.addChatItemAction?.item?.liveChatMembershipItemRenderer,
              action.addChatItemAction?.item?.liveChatViewerEngagementMessageRenderer
            ]
            for (const renderer of messageRenderers) {
              if (renderer) {
                const message = this.parseMessageRenderer(renderer, action)
                if (message) {
                  messages.push(message)
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao parsear mensagens:', error)
    }
    return messages
  }
  // Parsear um renderer de mensagem específico
  parseMessageRenderer(renderer, _action) {
    try {
      // Extrair nome do autor
      let authorName = 'Usuário'
      if (renderer.authorName?.simpleText) {
        authorName = renderer.authorName.simpleText
      } else if (renderer.authorName?.runs?.[0]?.text) {
        authorName = renderer.authorName.runs[0].text
      }
      // Extrair texto da mensagem
      let messageText = ''
      // Diferentes estruturas de mensagem
      if (renderer.message?.simpleText) {
        messageText = renderer.message.simpleText
      } else if (renderer.message?.runs) {
        // Mensagem com runs (formatação)
        messageText = renderer.message.runs.map((run) => run.text || '').join('')
      } else if (renderer.message?.text) {
        messageText = renderer.message.text
      } else if (renderer.text?.simpleText) {
        messageText = renderer.text.simpleText
      } else if (renderer.text?.runs) {
        messageText = renderer.text.runs.map((run) => run.text || '').join('')
      }
      // Se não encontrou texto, tentar outros campos
      if (!messageText) {
        if (renderer.displayMessage) {
          messageText = renderer.displayMessage
        } else if (renderer.content) {
          messageText = renderer.content
        }
      }
      // Pular mensagens vazias
      if (!messageText || messageText.trim() === '') {
        return null
      }
      return {
        id: `scraped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        author: {
          name: authorName,
          color: this.generateUserColor(authorName)
        },
        message: {
          text: messageText
        },
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Erro ao parsear renderer:', error)
      return null
    }
  }
  // Gerar cor para usuário
  generateUserColor(username) {
    let hash = 0
    for (let i = 0; i < username.length; i++) {
      const char = username.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    const hue = Math.abs(hash) % 360
    const saturation = 70 + (Math.abs(hash) % 30)
    const lightness = 50 + (Math.abs(hash) % 20)
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }
}
export default YouTubeScraperService
