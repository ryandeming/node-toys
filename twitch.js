files
  .forEach(function(file) {
    ol.upload(
      {
        file: file.path
      },
      progress =>
        console.log(`Upload progress: ${(progress.percent * 100).toFixed(2)}%`)
    ).then(res => {
      // push the resulting id to an array that will be returned
      mirrors.push({
        id: res.id
      });
    });
  })
  .then(() => {
    //do some sort of promise related thing?
  });
 
const filePromises = [];
 
for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const filePromise = ol
    .upload(
      {
        file: file.path
      },
      progress =>
        console.log(`Upload progress: ${(progress.percent * 100).toFixed(2)}%`)
    )
    .then(result => {
      return result.id;
    });
  filePromises.push(filePromise);
}
 
 
Promise.all(filePromises).then(result => {
  // [ 1, 2, 3, 4]
})