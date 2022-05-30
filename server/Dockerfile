# Pull a python image
FROM python:3.8-alpine

# Set compile environment
ENV GROUP_ID=100 \
    USER_ID=1008

# copy the requirements file into the image
COPY ./requirements.txt /var/www/requirements.txt

# switch working directory
WORKDIR /var/www

# install the dependencies and packages in the requirements file
RUN pip install -r requirements.txt
RUN pip install gunicorn

# copy every content from the local file to the image
COPY . /var/www

# configure the container to run in an executed manner
#RUN addgroup -g $GROUP_ID www
#RUN adduser -D -u $USER_ID -G www www -s /bin/sh

#USER www

EXPOSE 5005
EXPOSE 27017

ENTRYPOINT [ "python" ]


CMD ["main.py" ]

# TODO: Convert to gunicorn
#CMD [ "gunicorn", "-w", "4", "--bind", "0.0.0.0:5005", "app:app"]
