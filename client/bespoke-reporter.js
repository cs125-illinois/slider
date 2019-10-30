module.exports = () => {
  return (deck) => {
    let reportedSlide
    let currentSlide
    const reportChange = () => {
      if (deck.socket && currentSlide !== reportedSlide) {
        deck.socket.emit('reporter', {
          deckID: deck.id,
          slideSemester: deck.semester,
          slideID: currentSlide
        })
        reportedSlide = currentSlide
      }
    }
    deck.on('activate', slideData => {
      currentSlide = slideData.slideID
      reportChange()
    })
    deck.on('login', () => {
      reportChange()
    })
  }
}
